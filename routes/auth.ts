import express from "express";
import controller from "../controllers/user";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.post("/token", controller.getRefreshToken);
router.get("/validate", extractJWT, controller.validateToken);
router.post("/login/facebook", controller.loginFacebook);
router.post("/login/gmail", controller.loginGmail);
router.get("/verify", extractJWT, controller.generateVerifyNumber);
router.post("/verify", extractJWT, controller.verifyEmailNumber);
router.post("/logout", controller.logout);
router.post("/login", controller.login);
router.post("/register", controller.register);
router.get("/profile", extractJWT, controller.getProfile);
router.put("/profile/password", extractJWT, controller.updateProfilePassword);
router.put("/profile", extractJWT, controller.updateProfile);

export default router;
