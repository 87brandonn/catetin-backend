import { ExpoPushMessage } from "expo-server-sdk";
import fs from "fs";
import handlebars from "handlebars";
import pdf from "html-pdf";
import moment from "moment-timezone";
import path from "path";
import { Op } from "sequelize";
import { format } from "util";
import { v1 } from "uuid";
import { bucket } from "../controllers/media";
import jobs from "../cron";
import IUser from "../interfaces/user";
import { default as models } from "../models";
import transporter from "../nodemailer";
import { ISchedulerUser } from "./../interfaces/scheduler";
import { getScheduleType } from "./index";
import { triggerPushNotification } from "./pushNotification";
import { getTransactionReport } from "./transaction";

handlebars.registerHelper("toLocaleString", (number) => {
  return parseInt(number || "0", 10).toLocaleString("id-ID");
});

const { Transaction, Scheduler } = models;

export const triggerCron = async (
  userStore: {
    UserId: number;
    StoreId: number;
    grant: "owner" | "employee";
    User: IUser & {
      UserDevices: {
        DeviceId: number;
        UserID: number;
        Device: {
          token: string;
          id: number;
        };
      }[];
    };
  },
  schedule: ISchedulerUser
) => {
  const indexFound = jobs.findIndex((job) => job.id === schedule.StoreId);
  const currentDate = new Date();

  const previous = getScheduleType(schedule);

  const from = moment(currentDate).subtract(1, previous).toISOString();
  const to = currentDate.toISOString();
  const query = {
    StoreId: schedule.StoreId,
    transaction_date: {
      [Op.between]: [
        moment(from as string).toDate(),
        moment(to as string).toDate(),
      ],
    },
    deleted: false,
  };

  jobs[indexFound].initDate = to;

  let [transaction, income, outcome, scheduleData]: [
    transaction: any,
    income: number | undefined,
    outcome: number | undefined,
    scheduleData: any
  ] = await Promise.all([
    getTransactionReport(schedule.StoreId, {
      transaction_date: query.transaction_date,
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
    Scheduler.update(
      {
        lastTrigger: currentDate,
      },
      {
        where: {
          StoreId: schedule.StoreId,
        },
      }
    ),
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
    storeName: schedule.Store.name || "Catetin Toko",
    from: moment(from)
      .locale("id")
      .tz("Asia/Jakarta")
      .format("DD MMMM YYYY HH:mm"),
    to: moment(to).locale("id").tz("Asia/Jakarta").format("DD MMMM YYYY HH:mm"),
    incomeReport: transaction?.filter(
      (data: any) => data.rootType === "income"
    ),
    outcomeReport: transaction?.filter(
      (data: any) => data.rootType === "outcome"
    ),
    income: Number(income || 0).toLocaleString("id-ID"),
    outcome: Number(outcome || 0).toLocaleString("id-ID"),
    impression,
  };

  const __dirname = path.resolve();
  const filePath = path.join(__dirname, "/template/financial-report.html");
  const source = fs.readFileSync(filePath, "utf-8");
  const template = handlebars.compile(source);
  const html = template(data);

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
      const fileName = `financial-report/LaporanKeuangan-${v1()}-${
        data.storeName
      }-${data.from}-${data.to}.pdf`;
      const file = bucket.file(fileName);

      await file.save(buffer, {
        contentType: "application/pdf",
      });
      await file.makePublic();

      const publicUrl = format(
        `https://storage.googleapis.com/${bucket.name}/${fileName}`
      );

      const messages = userStore.User.UserDevices.map((device) => ({
        to: device.Device.token,
        sound: "default",
        title: "Laporan Keuangan Otomatis",
        body: `Laporan keuangan otomatis kamu untuk periode ini telah di kirim ke email ${userStore.User.email}`,
      }));

      promises.push(
        transporter.sendMail({
          from: "brandonpardede25@gmail.com",
          to: userStore.User.email,
          subject: "Laporan Keuangan Otomatis",
          html: `Hi, ${userStore.User.email}. Berikut adalah laporan keuangan kamu untuk periode ini. Terimakasih telah menggunakan Catetin!`,
          attachments: [
            {
              filename: fileName.replace("financial-report/", ""),
              path: publicUrl,
            },
          ],
        })
      );

      if (messages.length) {
        promises.push(triggerPushNotification(messages as ExpoPushMessage[]));
      }

      console.log(
        `Financial report has been sent to user ${userStore.User.email}`
      );

      return await Promise.all(promises);
    });
};
