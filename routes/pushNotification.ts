import express from "express";
import controller from "../controllers/pushNotification";
import extractJWT from "../middleware/extractJWT";

const router = express.Router();

router.post("/register", controller.registerDevice);

export default router;
