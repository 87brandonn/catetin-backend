import { registerUserAndStore } from "./../controllers/user";
import express from "express";
import controller from "../controllers/user";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.post("/token", controller.getRefreshToken);
router.get("/validate", extractJWT, controller.validateToken);
router.post("/login/auto", controller.autoLoginFromInvitation);
router.post("/login/facebook", controller.loginFacebook);
router.post("/login/gmail", controller.loginGmail);
router.get("/reset-password", controller.generatePasswordResetNumber);
router.post("/reset-password", controller.verifyResetPassword);
router.get("/verify", extractJWT, controller.generateVerifyNumber);
router.post("/verify", extractJWT, controller.verifyEmailNumber);
router.post("/logout", controller.logout);
router.post("/login", controller.login);
router.post("/register-store", controller.registerUserAndStore);
router.post("/register", controller.register);
router.get("/profile", extractJWT, controller.getProfile);
router.put("/profile/password", controller.updatePassword);
router.put("/profile", extractJWT, controller.updateProfile);

export default router;
