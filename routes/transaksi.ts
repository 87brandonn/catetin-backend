import express from "express";
import controller from "../controllers/transaksi";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.put("/detail", extractJWT, controller.updateTransaksiDetail);
router.post("/detail", extractJWT, controller.insertTransaksiDetail);
router.post("/", extractJWT, controller.insertTransaksi);
router.get("/report", extractJWT, controller.getTransaksiReport);
router.get("/", extractJWT, controller.getTransaksi);
router.put("/", extractJWT, controller.updateTransaksi);
router.delete("/:id", extractJWT, controller.deleteTransaksi);

export default router;
