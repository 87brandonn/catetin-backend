import express from "express";
import controller from "../controllers/barang";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.delete("/:id", extractJWT, controller.deleteBarang);
router.post("/", extractJWT, controller.insertBarang);
router.put("/", extractJWT, controller.updateBarang);
router.get("/:id", extractJWT, controller.getBarangDetail);
router.get("/", extractJWT, controller.getListBarang);

export default router;
