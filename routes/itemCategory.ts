import express from "express";
import controller from "../controllers/itemCategory";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.get("/:id", extractJWT, controller.getItemCategory);
router.post("/global", extractJWT, controller.insertItemCategoryGlobal);
router.post("/:id", extractJWT, controller.insertItemCategory);

export default router;
