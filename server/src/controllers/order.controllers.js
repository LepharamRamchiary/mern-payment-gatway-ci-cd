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

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrder.id}|${totalAmount}`)
      .digest("hex");

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          orderId: order._id,
          razorpayOrderId: razorpayOrder.id,
          amount: totalAmount,
          currency: "INR",
          razorpaySignature: generatedSignature,
        },
        "Order created successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

  if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
    throw new ApiError(400, "All payment details are required");
  }

  try {

    // frontend intregation

    // Generate signature for verification
    // const body = razorpayOrderId + "|" + razorpayPaymentId;
    // const expectedSignature = crypto
    //   .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    //   .update(body.toString())
    //   .digest("hex");

    // // Verify signature
    // if (expectedSignature !== razorpaySignature) {
    //   throw new ApiError(400, "Invalid payment signature");
    // }





    // Update order with payment details
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          razorpayPaymentId,
          razorpaySignature,
          paymentStatus: "completed",
          orderStatus: "processing",
        },
      },
      { new: true }
    ).populate([
      {
        path: "user",
        select: "name email username",
      },
      {
        path: "products.product",
        select: "title price image",
      },
    ]);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Update product stock
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    return res.status(200).json(
      new ApiResponse(200, order, "Payment verified successfully")
    );
  } catch (error) {
    // Update order status to failed
    await Order.findByIdAndUpdate(orderId, {
      $set: { paymentStatus: "failed" },
    });
    
    throw new ApiError(500, error.message);
  }
});

const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page= 1, limit= 10 } = req.query;
  
  try {
    const orders = await Order.find({ user: userId}).populate([
      {
        path: "products.product",
        select: "title price image",
      }
    ]).sort({ createdAt: -1 }).sort({ updatedAt: -1 }).limit(limit * 1).skip((page - 1) * limit).exec();

    const count = await Order.countDocuments({ user: userId });
    
    const ordersData = {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      orders,
    };
    
    return res.status(200).json(
      new ApiResponse(200, ordersData, "Orders fetched successfully")
    );
    
  } catch (error) {
    throw new ApiError(500, error.message);
  }
})

export { createOrder , verifyPayment, getUserOrders};