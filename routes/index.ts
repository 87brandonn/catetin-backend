import express from "express";
import authRouter from "./auth";
import barangRouter from "./barang";
import mediaRouter from "./media";
import schedulerRouter from "./scheduler";
import transaksiRouter from "./transaksi";
import itemCategoryRouter from "./itemCategory";
import storeRouter from "./store";

const routes = express.Router();

routes.use("/auth", authRouter);
routes.use("/barang", barangRouter);
routes.use("/store", storeRouter);
routes.use("/transaksi", transaksiRouter);
routes.use("/item-category", itemCategoryRouter);
routes.use("/media", mediaRouter);
routes.use("/scheduler", schedulerRouter);

export default routes;
