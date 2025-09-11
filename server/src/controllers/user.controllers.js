import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, username, password, email } = req.body;

  try {
    if (
      [name, username, password, email].some((field) => field?.trim() === "")
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existedUser) {
      if (existedUser.email === email) {
        throw new ApiError(400, "Email already exists");
      }
      if (existedUser.username === username) {
        throw new ApiError(400, "Username already exists");
      }
    }

    let avatarData = null;

    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if (avatarLocalPath) {
      const uploaded = await uploadOnCloudinary(avatarLocalPath);
      if (uploaded) {
        avatarData = {
          public_id: uploaded.public_id,
          url: uploaded.url,
        };
      }
    }

    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email,
      password,
      avatar: avatarData,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "User not found Something went wrong");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User created successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export { registerUser };
