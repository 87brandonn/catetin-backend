import express from "express";
import router from "./auth";
import authRouter from "./auth";
import controller from '../controllers/user';

const routes = express.Router();

routes.use("/auth", authRouter);
router.get('/validate', controller.validateToken);
router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/get/all', controller.getAllUsers);

export default routes;
