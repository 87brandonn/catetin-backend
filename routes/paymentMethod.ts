import express from "express";
import controller from "../controllers/paymentMethod";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.get("/:id", extractJWT, controller.getPaymentMethod);
router.post("/global", extractJWT, controller.insertPaymentMethodGlobal);
router.post("/:id", extractJWT, controller.insertPaymentMethod);
router.delete("/:id", extractJWT, controller.deletePaymentMethod);

export default router;
