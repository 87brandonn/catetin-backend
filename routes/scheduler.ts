import express from "express";
import { addScheduler, getScheduler } from "../controllers/scheduler";
import extractJWT from "../middleware/extractJWT";

const router = express.Router();

router.get("/", extractJWT, getScheduler);
router.post("/", extractJWT, addScheduler);

export default router;
