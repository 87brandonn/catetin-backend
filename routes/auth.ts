import express from "express";
import controller from "../controllers/user";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.get("/validate", extractJWT, controller.validateToken);
router.post("/login/gmail", controller.loginGmail);
router.post("/login", controller.login);
router.post("/register", controller.register);
router.get("/profile", extractJWT, controller.getProfile);
router.put("/profile/password", extractJWT, controller.updateProfilePassword);
router.put("/profile", extractJWT, controller.updateProfile);

export default router;
