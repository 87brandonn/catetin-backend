import express from "express";
import multer from "multer";
import { postImage } from "../controllers/media";

const maxSize = 2 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSize },
});
const router = express.Router();

router.post("/", upload.single("image"), postImage);
export default router;
