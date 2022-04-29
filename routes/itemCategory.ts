import express from "express";
import controller from "../controllers/itemCategory";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.get("/", extractJWT, controller.getItemCategory);
router.post("/", extractJWT, controller.insertItemCategory);

export default router;
