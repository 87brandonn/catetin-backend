import express from "express";
import multer from "multer";
import { postImage } from "../controllers/media";

const upload = multer({
  storage: multer.memoryStorage(),
});
const router = express.Router();

router.post("/", upload.single("image"), postImage);
export default router;
