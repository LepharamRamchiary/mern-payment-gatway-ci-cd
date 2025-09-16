import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  getUserOrders,
  getSingleOrder,
  getAllOrders,
  updateOrderStatus
} from "../controllers/order.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);


router.route("/create").post(createOrder);
router.route("/verify").post(verifyPayment);
router.route("/my-orders").get(getUserOrders);
router.route("/:id").get(getSingleOrder);

// Admin routes
router.route("/admin/all-orders").get(getAllOrders);
router.route("/admin/:id").patch(updateOrderStatus);


export default router;