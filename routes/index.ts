import express from "express";
import router from "./auth";
import authRouter from "./auth";
import controller from "../controllers/user";
import controllerBarang from "../controllers/barang";
import extractJWT from "../middleware/extractJWT";

const routes = express.Router();

routes.use("/auth", authRouter);
routes.get("/get/profile", extractJWT, controller.getProfile)
routes.post("/update/profile", extractJWT, controller.updateProfile)
routes.post("/insert/barang", extractJWT, controllerBarang.insertBarang)
routes.post("/update/barang", extractJWT, controllerBarang.updateBarang)
routes.get("/get/barang", extractJWT, controllerBarang.getListBarang)

export default routes;
