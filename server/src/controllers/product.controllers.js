import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Product } from "../models/product.model.js";

const createProduct = asyncHandler(async (req, res) => {
  const user = req.user;
  const { title, desc, price, stock, image } = req.body;

  if (!user?.isAdmin) {
    throw new ApiError(400, "Only admin create a product");
  }

  try {
    if ([title, desc, price, image].some((f) => f?.trim() === "")) {
      throw new ApiError(400, "All fields are require to create a product");
    }

    const imageLocalPath = req.files?.image?.[0]?.path;

    if (!imageLocalPath) {
      throw new ApiError(400, "Image file required");
    }

    const imageUpload = await uploadOnCloudinary(imageLocalPath);

    const createdProduct = await Product.create({
      title,
      desc,
      price,
      stock,
      image: {
        public_id: imageUpload.public_id,
        url: imageUpload.url,
      },
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, createdProduct, "Producat create sucessfully")
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      throw new ApiError(404, "Product id not found");
    }

    const product = await Product.findById(id);

    return res
      .status(200)
      .json(new ApiResponse(200, product, "Succseefullu fetch single product"));
  } catch (error) {
    throw new ApiError(500, "Somting wrong when geting single product");
  }
});

const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 6 } = req.query;
  try {
    const products = await Product.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.countDocuments();

    const productData = {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      products,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(200, productData, "Successfully fetch all products")
      );
  } catch (error) {
    throw new ApiError(500, "Error when fetching all products");
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const { title, desc, price, stock } = req.body;

  if (!user?.isAdmin) {
    throw new ApiError(403, "Only admin can update the product");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (!title && !desc && !price && !stock && !req.files?.image?.[0]?.path) {
    throw new ApiError(400, "At least one field is required to update");
  }

  try {
    const updateData = {};

    if (title && title !== product.title) {
      updateData.title = title;
    }

    if (desc && desc !== product.desc) {
      updateData.desc = desc;
    }

    if (price && price !== product.price) {
      updateData.price = price;
    }

    if (stock && stock !== product.stock) {
      updateData.stock = stock;
    }

    const imageLocalPath = req.files?.image?.[0]?.path;
    if (imageLocalPath) {
      if (product.image?.public_id) {
        await deleteFromCloudinary(product.image.public_id);
      }

      //   console.log("old id", product.image?.public_id);

      const uploadedImage = await uploadOnCloudinary(imageLocalPath);

      if (!uploadedImage || !uploadedImage.url) {
        throw new ApiError(400, "Error when uploading product image");
      }

      updateData.image = {
        public_id: uploadedImage.public_id,
        url: uploadedImage.url,
      };
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedProduct, "Product updated successfully")
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  if (!user?.isAdmin) {
    throw new ApiError(403, "Only admin can delete a product");
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  try {
    if (product.image?.public_id) {
      await deleteFromCloudinary(product.image.public_id);
    }

    console.log("id", product.image?.public_id);

    const deletedProduct = await Product.findByIdAndDelete(id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedProduct, "Product deleted successfully")
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export {
  createProduct,
  getProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
};
