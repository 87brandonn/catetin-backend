import express from "express";
import controller from "../controllers/store";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.delete("/:id/user/:userId", extractJWT, controller.deleteStoreUser);
router.delete("/:id", extractJWT, controller.deleteStore);
router.post("/:id/user", controller.insertUserStore);
router.post("/invite", extractJWT, controller.inviteUserToStore);
router.post("/", extractJWT, controller.upsertStore);
router.get("/:id/user", extractJWT, controller.getUserByStoreId);
router.get("/", extractJWT, controller.getStore);

export default router;
