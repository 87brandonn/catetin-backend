import express from "express";
import multer from "multer";
import controller from "../controllers/barang";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.delete("/:id", extractJWT, controller.deleteBarang);
router.post(
  "/import/:id",
  upload.single("file"),
  extractJWT,
  controller.importCSV
);
router.post("/:id", extractJWT, controller.insertBarang);
router.put("/", extractJWT, controller.updateBarang);
router.get("/:id/list", extractJWT, controller.getListBarang);
router.get("/:id", extractJWT, controller.getBarangDetail);

export default router;
