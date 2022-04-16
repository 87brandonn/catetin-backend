import express from "express";
import { addScheduler, getScheduler } from "../controllers/scheduler";
import extractJWT from "../middleware/extractJWT";

const router = express.Router();

router.get("/:id", extractJWT, getScheduler);
router.post("/:id", extractJWT, addScheduler);

export default router;
