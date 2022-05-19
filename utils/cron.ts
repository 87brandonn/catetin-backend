import { ExpoPushMessage } from "expo-server-sdk";
import { ICatetinTransaksi } from "./../interfaces/transaksi";
import { getScheduleType } from "./index";
import { ISchedulerUser } from "./../interfaces/scheduler";
import fs from "fs";
import handlebars from "handlebars";
import pdf from "html-pdf";
import moment from "moment-timezone";
import path from "path";
import { Op } from "sequelize";
import { format } from "util";
import { bucket } from "../controllers/media";
import jobs from "../cron";
import { default as db, default as models } from "../models";
import transporter, { mailData } from "../nodemailer";
import { triggerPushNotification } from "./pushNotification";

const { Transaction, Scheduler, UserDeviceToken, DeviceToken } = models;

export const triggerCron = async (
  userId: number,
  storeId: number,
  email: string,
  storeName: string,
  schedule: ISchedulerUser
) => {
  let messages: ExpoPushMessage[] = [];

  const indexFound = jobs.findIndex((job) => job.id === storeId);
  const currentDate = new Date();

  const previous = getScheduleType(schedule);

  const from = moment(currentDate).subtract(1, previous).toISOString();
  const to = currentDate.toISOString();
  const query = {
    StoreId: storeId,
    transaction_date: {
      [Op.between]: [
        moment(from as string).toDate(),
        moment(to as string).toDate(),
      ],
    },
    deleted: false,
  };

  let [transaction, income, outcome]: [
    transaction: { type: string; total_amount: string }[],
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
    value: Number(Math.abs((income || 0) - (outcome || 0))).toLocaleString(
      "id-ID"
    ),
    profit: (income || 0) > (outcome || 0) ? true : false,
  };

  const data = {
    storeName: storeName || "Catetin Toko",
    from: moment(from)
      .locale("id")
      .tz("Asia/Jakarta")
      .format("DD MMMM YYYY HH:mm"),
    to: moment(to).locale("id").tz("Asia/Jakarta").format("DD MMMM YYYY HH:mm"),
    item_export: Number(
      transaction?.find((eachTransaction) => eachTransaction.type === "3")
        ?.total_amount || 0
    )?.toLocaleString("id-ID"),
    additional_income: Number(
      transaction?.find((eachTransaction) => eachTransaction.type === "2")
        ?.total_amount || 0
    )?.toLocaleString("id-ID"),
    item_import: Number(
      transaction?.find((eachTransaction) => eachTransaction.type === "4")
        ?.total_amount || 0
    )?.toLocaleString("id-ID"),
    additional_outcome: Number(
      transaction?.find((eachTransaction) => eachTransaction.type === "1")
        ?.total_amount || 0
    )?.toLocaleString("id-ID"),
    income: Number(income || 0).toLocaleString("id-ID"),
    outcome: Number(outcome || 0).toLocaleString("id-ID"),
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
        StoreId: storeId,
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
        const promises = [];
        const fileName = `financial-report/LaporanKeuangan${storeId}-${data.storeName}-${data.from}-${data.to}.pdf`;
        const file = bucket.file(fileName);

        await file.save(buffer, {
          contentType: "application/pdf",
        });
        await file.makePublic();

        const publicUrl = format(
          `https://storage.googleapis.com/${bucket.name}/${fileName}`
        );

        const deviceData = JSON.parse(
          JSON.stringify(
            await UserDeviceToken.findAll({
              where: {
                UserId: userId,
              },
              include: {
                model: DeviceToken,
              },
            })
          )
        );

        // deviceData.forEach((device: any) => {
        //   messages.push({
        //     to: device.DeviceToken?.token,
        //     sound: "default",
        //     title: "Laporan Keuangan Otomatis",
        //     body: `Laporan keuangan otomatis kamu untuk periode ini telah di kirim ke email ${email}`,
        //     data: {
        //       withSome: "data",
        //     },
        //   });
        // });

        promises.push(
          transporter.sendMail({
            from: "brandonpardede25@gmail.com",
            to: email,
            subject: "Laporan Keuangan Otomatis",
            html: `Hi, ${email}. Berikut adalah laporan keuangan kamu untuk periode ini. Terimakasih telah menggunakan Catetin!`,
            attachments: [
              {
                filename: fileName.replace("financial-report/", ""),
                path: publicUrl,
              },
            ],
          })
        );

        // promises.push(triggerPushNotification(messages));

        await Promise.all(promises);

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
