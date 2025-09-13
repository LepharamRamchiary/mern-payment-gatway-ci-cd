import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerSetup from "./utils/swagger.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//json data
app.use(express.json({ limit: "20kb" }));
//url data
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

app.use(express.static("public"));

// routes import
import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import orderRouter from "./routes/order.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);

// Swagger
swaggerSetup(app);

app.use(errorHandler);

export { app };
