import { ICatetinTransaksi } from "./../interfaces/transaksi";
import { getScheduleType } from "./index";
import { ISchedulerUser } from "./../interfaces/scheduler";
import fs from "fs";
import handlebars from "handlebars";
import pdf from "html-pdf";
import moment from "moment";
import path from "path";
import { Op } from "sequelize";
import { format } from "util";
import { bucket } from "../controllers/media";
import jobs from "../cron";
import { default as db, default as models } from "../models";
import transporter, { mailData } from "../nodemailer";

const { Transaction, Scheduler } = models;

export const triggerCron = async (
  userId: number,
  email: string,
  storeName: string,
  schedule: ISchedulerUser
) => {
  const indexFound = jobs.findIndex((job) => job.id === userId);
  const currentDate = new Date();

  const previous = getScheduleType(schedule);

  const from = moment(currentDate).subtract(1, previous).toISOString();
  const to = currentDate.toISOString();
  const query = {
    UserId: userId,
    transaction_date: {
      [Op.between]: [
        moment(from as string).toDate(),
        moment(to as string).toDate(),
      ],
    },
  };

  let [transaction, income, outcome]: [
    transaction: ICatetinTransaksi[],
    income: number | undefined,
    outcome: number | undefined
  ] = await Promise.all([
    Transaction.findAll({
      where: {
        ...query,
      },
      attributes: [
        "type",
        [db.sequelize.fn("sum", db.sequelize.col("nominal")), "total_amount"],
      ],
      group: ["type"],
    }),
    Transaction.sum("nominal", {
      where: {
        rootType: "income",
        ...query,
      },
    }),
    Transaction.sum("nominal", {
      where: {
        rootType: "outcome",
        ...query,
      },
    }),
  ]);

  transaction = JSON.parse(JSON.stringify(transaction));
  income = JSON.parse(JSON.stringify(income));
  outcome = JSON.parse(JSON.stringify(outcome));

  const impression = {
    value: Math.abs((income || 0) - (outcome || 0)),
    profit: (income || 0) > (outcome || 0) ? true : false,
  };

  const data = {
    storeName: storeName || "TokoCatetin",
    from: moment(from).format("DD MMMM YYYY"),
    to: moment(to).format("DD MMMM YYYY"),
    item_export:
      transaction?.find((eachTransaction) => eachTransaction.type === "3") || 0,
    additional_income:
      transaction?.find((eachTransaction) => eachTransaction.type === "2") || 0,
    item_import:
      transaction?.find((eachTransaction) => eachTransaction.type === "4") || 0,
    additional_outcome:
      transaction?.find((eachTransaction) => eachTransaction.type === "1") || 0,
    income: income || 0,
    outcome: outcome || 0,
    impression,
  };

  const __dirname = path.resolve();
  const filePath = path.join(__dirname, "/template/financial-report.html");
  const source = fs.readFileSync(filePath, "utf-8");
  const template = handlebars.compile(source);
  const html = template(data);

  await Scheduler.update(
    {
      lastTrigger: currentDate,
    },
    {
      where: {
        UserId: userId,
      },
    }
  );

  if (process.env.NODE_ENV === "production") {
    pdf
      .create(html, {
        format: "A4",
      })
      .toBuffer(async (err: any, buffer) => {
        if (err) {
          console.error(
            "An error occured while generating financial report PDF",
            err
          );
          throw new Error(err);
        }
        const fileName = `financial-report/LaporanKeuangan${userId}-${data.storeName}-${data.from}-${data.to}.pdf`;
        const file = bucket.file(fileName);

        await file.save(buffer, {
          contentType: "application/pdf",
        });
        await file.makePublic();

        const publicUrl = format(
          `https://storage.googleapis.com/${bucket.name}/${fileName}`
        );

        await transporter.sendMail({
          ...mailData(email),
          attachments: [
            {
              filename: fileName.replace("financial-report/", ""),
              path: publicUrl,
            },
          ],
        });

        console.log(`Financial report has been sent to user ${email}`);
        jobs[indexFound].initDate = to;
      });
  } else {
    jobs[indexFound].initDate = to;
    console.log(
      `Jobs finished triggered for user: ${email} from ${from} to ${to}`,
      `Income : ${data.income}`,
      `Outcome : ${data.outcome}`,
      `Store Name : ${data.storeName}`
    );
  }
};
