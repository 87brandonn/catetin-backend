import express from "express";
import authRouter from "./auth";
import barangRouter from "./barang";
import mediaRouter from "./media";
import transaksiRouter from "./transaksi";

const routes = express.Router();

routes.use("/auth", authRouter);
routes.use("/barang", barangRouter);
routes.use("/transaksi", transaksiRouter);
routes.use("/media", mediaRouter);

export default routes;
