import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
      // Get token from cookie or Authorization header
      let token;
      
      if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
      } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }
      
      // Debug token
      console.log("Token received:", token);
      
      // If no token found
      if (!token) {
        throw new ApiError(401, "Unauthorized request - no token provided");
      }
      
      // Verify token
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      // console.log("Decoded token:", decodedToken);
      
      // Find user
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
      if (!user) {
        throw new ApiError(401, "Invalid Access Token - user not found");
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error("JWT Verification Error:", error);
      throw new ApiError(401, error?.message || "Invalid Access Token");
    }
  });