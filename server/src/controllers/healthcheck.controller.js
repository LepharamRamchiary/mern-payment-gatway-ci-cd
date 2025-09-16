import { ApiResponse } from "../utils/ApiResponse.js";

const healthCheck = async (req, res) => {
  res.status(200).send("ok");
};

export { healthCheck };