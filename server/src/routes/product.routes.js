import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createProduct,
  getProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controllers.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/")
  .post(upload.fields([{ name: "image", maxCount: 1 }]), createProduct);
router.route("/").get(getAllProducts);
router.route("/:id").get(getProduct);
router
  .route("/:id")
  .put(upload.fields([{ name: "image", maxCount: 1 }]), updateProduct)
  .delete(deleteProduct);

export default router;
