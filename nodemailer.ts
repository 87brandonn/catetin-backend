import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  port: 465,
  host: "smtp.gmail.com",
  auth: {
    user: "brandonpardede25@gmail.com",
    pass: "riouddryqfbdspri",
  },
  secure: true,
});

const mailData = (to: string) => ({
  from: "brandonpardede25@gmail.com",
  to,
  subject: "Laporan Keuangan Harian",
  text: `Hi, ${to}. Berikut adalah laporan keuangan kamu untuk bulan ini. Terimakasih telah menggunakan Catetin!`,
  html: `Hi, ${to}. Berikut adalah laporan keuangan kamu untuk periode ini. Terimakasih telah menggunakan Catetin!`,
});

export default transporter;
export { mailData };
