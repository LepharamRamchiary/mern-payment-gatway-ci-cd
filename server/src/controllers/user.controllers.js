import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

const generateToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefershToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: true });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate token");
  }
};

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

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username && !password) {
      throw new ApiError(400, "Username and password are required");
    }

    const user = await User.findOne({ username });

    if (!user) {
      throw new ApiError(400, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged in successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Failed to login. Something went wrong");
  }
});

const logout = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      throw new ApiError(200, "User not found or Unauthorized");
    }

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: null,
        },
      },
      { new: true }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .clearCookie("accessToken", "", options)
      .clearCookie("refreshToken", "", options)
      .json(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export { registerUser, login, logout };
