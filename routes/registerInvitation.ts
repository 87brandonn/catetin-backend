import express from "express";
import controller from "../controllers/registerInvitation";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.get("/:id", controller.getRegisterInvitation);
router.put("/:id", controller.updateRegisterInvitation);

export default router;
