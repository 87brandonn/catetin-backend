import express from "express";
import controller from "../controllers/user";
import extractJWT from "../middleware/extractJWT";
const router = express.Router();

router.get("/validate", extractJWT, controller.validateToken);
router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/users", controller.getAllUsers);
router.post("/register/gmail", controller.registerGmail);
router.post("/login/gmail", controller.loginGmail);
router.get("/profile", extractJWT, controller.getProfile);
router.post("/profile", extractJWT, controller.updateProfile);

export default router;
