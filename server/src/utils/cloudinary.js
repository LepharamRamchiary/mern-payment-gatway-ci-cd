import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

import dotenv from "dotenv";
dotenv.config(); 


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// for uploading image to cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error("Local file path is invalid:", localFilePath);
      throw new Error("File path is required for upload");
    }

    console.log("Uploading file to Cloudinary:", localFilePath);

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("Cloudinary upload response:", response);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Remove local file
    }

    return response;
  } catch (error) {
    console.error("Error during Cloudinary upload:", error.message);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Cleanup local file on error
    }
    throw new Error("Failed to upload file to Cloudinary");
  }
};

// for delete
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error("Failed to delete the file from Cloudinary");
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };