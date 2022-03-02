import express from "express";
import router from "./auth";
import authRouter from "./auth";
import controller from "../controllers/user";

const routes = express.Router();

routes.use("/auth", authRouter);

export default routes;
