import express from "express";
import { getAuth } from "../handlers/auth";

const router = express.Router();

router.get("/", getAuth);

export default router;
