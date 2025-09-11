import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUser, login } from "../controllers/user.controllers.js";

const router = Router();

router
  .route("/register")
  .post(upload.fields([{ name: "avatar", maxCount: 1 }]), registerUser);
router.route("/login").post(login);

export default router;
