import express from "express";
import controller from "../controllers/store";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.delete("/:id", extractJWT, controller.deleteStore);
router.post("/", extractJWT, controller.upsertStore);
router.get("/", extractJWT, controller.getStore);

export default router;
