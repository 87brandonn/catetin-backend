import express from "express";
import controller from "../controllers/transactionType";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.get("/:id", extractJWT, controller.getTransactionType);
router.post("/global", extractJWT, controller.insertTransactionTypeGlobal);
router.post("/:id", extractJWT, controller.insertTransactionType);
router.delete("/:id", extractJWT, controller.deleteTransactionType);

export default router;
