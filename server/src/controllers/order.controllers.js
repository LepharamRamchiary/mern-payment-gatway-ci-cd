import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import razorpayInstance from "../utils/razorpay.js";
import crypto from "crypto";


const createOrder = asyncHandler(async (req, res) => {
  const { products, shippingAddress } = req.body;
  const userId = req.user._id;

  if (!products || products.length === 0) {
    throw new ApiError(400, "Products are required");
  }

  if (!shippingAddress) {
    throw new ApiError(400, "Shipping address is required");
  }

  try {
    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        throw new ApiError(404, `Product with ID ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for ${product.title}`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: totalAmount * 100, 
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: {
        userId: userId.toString(),
      },
    });

    const order = await Order.create({
      user: userId,
      products: orderProducts,
      totalAmount,
      razorpayOrderId: razorpayOrder.id,
      shippingAddress,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          orderId: order._id,
          razorpayOrderId: razorpayOrder.id,
          amount: totalAmount,
          currency: "INR",
          key: process.env.RAZORPAY_KEY_ID,
        },
        "Order created successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export { createOrder };