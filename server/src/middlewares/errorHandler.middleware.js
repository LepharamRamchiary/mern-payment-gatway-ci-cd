import { ApiError } from "../utils/ApiError.js";
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err instanceof ApiError) {
        return res.status(statusCode).json({
            statusCode,
            data: null,
            message,
            success: false,
            errors: err.errors,
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined, 
        });
    }

    return res.status(500).json({
        statusCode: 500,
        data: null,
        message: "Something went wrong!",
        success: false,
        errors: [],
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};

export { errorHandler };
