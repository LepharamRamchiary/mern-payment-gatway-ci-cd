import { Router } from "express";
import {
  createOrder,
  verifyPayment
} from "../controllers/order.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);


router.route("/create").post(createOrder);
router.route("/verify").post(verifyPayment);


export default router;