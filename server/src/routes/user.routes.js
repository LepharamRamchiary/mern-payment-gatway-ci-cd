import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  registerUser,
  login,
  logout,
  getCurrentUser,
  getAllUsers,
  updateUserAccount,
  updateUserAvatar,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/register")
  .post(upload.fields([{ name: "avatar", maxCount: 1 }]), registerUser);
router.route("/login").post(login);

// Protected routes
router.route("/logout").post(verifyJWT, logout);
router.route("/get-current-user").get(verifyJWT, getCurrentUser);
router.route("/get-all-users").get(verifyJWT, getAllUsers);
router.route("/update-account/:id").put(verifyJWT, updateUserAccount);
router
  .route("/avatar/:id")
  .put(
    verifyJWT,
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    updateUserAvatar
  );

export default router;
