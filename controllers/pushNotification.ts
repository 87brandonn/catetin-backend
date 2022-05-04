import { NextFunction, Request, Response } from "express";
import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

const expo = new Expo({
  accessToken: "GC9OaBBC1ICc7r1-U6U1zpzg-UXWL0_v7n6_AT_U",
});

const triggerTestPushNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let messages: ExpoPushMessage[] = [];

  messages.push({
    to: "ExponentPushToken[3P5XPmLtrMa63VL6-Sd0SH]",
    sound: "default",
    title: "Laporan Keuangan Otomatis",
    body: "Laporan keuangan otomatis kamu untuk periode ini telah di kirim ke email brandonpardede24@gmail.com",
    data: {
      withSome: "data",
    },
  });

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  for (let chunk of chunks) {
    try {
      let ticketChunk: any = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
    } catch (err) {
      console.error(err);
    }
  }
  let receiptIds: string[] = [];
  for (let ticket of tickets) {
    if (ticket.id) {
      receiptIds.push(ticket.id);
    }
  }
  let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  for (let chunk of receiptIdChunks) {
    try {
      let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      console.log(receipts);

      for (let receiptId in receipts) {
        let { status, message, details }: any = receipts[receiptId];
        if (status === "ok") {
          continue;
        } else if (status === "error") {
          console.error(
            `There was an error sending a notification: ${message}`
          );
          if (details && details.error) {
            console.error(`The error code is ${details.error}`);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
  res.status(200).send({
    message: "Succesfully perform push notification",
  });
};

export default {
  triggerTestPushNotification,
};
