import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  getUserOrders
} from "../controllers/order.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);


router.route("/create").post(createOrder);
router.route("/verify").post(verifyPayment);
router.route("/my-orders").get(getUserOrders);


export default router;