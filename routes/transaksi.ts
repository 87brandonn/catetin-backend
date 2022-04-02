import express from "express";
import controller from "../controllers/transaksi";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.post("/", extractJWT, controller.insertTransaksi);
router.get("/", extractJWT, controller.getTransaksi);
router.put("/", extractJWT, controller.updateTransaksi);

export default router;
