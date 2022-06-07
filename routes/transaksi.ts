import express from "express";
import controller from "../controllers/transaksi";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.put("/detail", extractJWT, controller.updateTransaksiDetail);
router.post("/detail", extractJWT, controller.insertTransaksiDetail);
router.post("/download", extractJWT, controller.downloadManualReport);
router.delete("/detail", extractJWT, controller.deleteTransaksiDetail);
router.post("/:id", extractJWT, controller.insertTransaksi);
router.get("/summary/:id", extractJWT, controller.getTransactionSummary);
router.get("/:id/list", extractJWT, controller.getTransaksi);
router.get("/:id", extractJWT, controller.getTransaksiById);
router.put("/", extractJWT, controller.updateTransaksi);
router.delete("/:id", extractJWT, controller.deleteTransaksi);

export default router;
