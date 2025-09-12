import mongoose, { mongo } from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    desc: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      index: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    image: {
      public_id: { type: String },
      url: { type: String },
    },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
