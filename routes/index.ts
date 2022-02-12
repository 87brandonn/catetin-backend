import express from "express";
import authRouter from "./auth";

const routes = express.Router();

routes.use("/auth", authRouter);

export default routes;
