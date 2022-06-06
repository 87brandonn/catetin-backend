import express from "express";
import controller from "../controllers/itemOptions";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.get("/", extractJWT, controller.getItemOptions);
router.post("/", extractJWT, controller.insertItemOptions);

export default router;
