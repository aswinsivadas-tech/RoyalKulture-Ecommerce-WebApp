import express from "express";
import { adminLogin } from "../controllers/adminAuth.js";
import { blockUnblockUser } from "../controllers/userController.js";

import { createProduct, deleteProduct, editProductDetails } from "../controllers/productController.js";
import {
  adminAddProductPage,
  adminDashboardPage,
  adminLoginPage,
  adminLogout,
  adminOrderDetailsPage,
  adminOrdersListPage,
  adminProductEditPage,
  adminProductsListPage,
  adminUsersListPage,
  updateOrderStatus,
} from "../controllers/adminController.js";
import { uploadFiles } from "../middleware/uploadMiddleware.js";

const adminRoutes = express.Router({ mergeParams: true });

adminRoutes.get("/", adminLoginPage);

adminRoutes.post("/login", adminLogin);

adminRoutes.get("/logout", adminLogout);

adminRoutes.get("/dashboard", adminDashboardPage);

adminRoutes.get("/users-list", adminUsersListPage);

adminRoutes.get("/products-list", adminProductsListPage);

adminRoutes.get("/products/edit/:id", adminProductEditPage);

adminRoutes.post("/edit-product/:id", editProductDetails);



adminRoutes.post(
  "/add-product",
  uploadFiles("userAssets/pictures", "multiple", "productImages", 4),
  createProduct
);

adminRoutes.post("/products/delete/:id", deleteProduct);

adminRoutes.post("/block-user/:id", blockUnblockUser);

adminRoutes.get("/add-product", adminAddProductPage);

adminRoutes.get("/orders-list", adminOrdersListPage);

adminRoutes.get("/update-order-status/:id/:status", updateOrderStatus);

adminRoutes.get("/orders/:id", adminOrderDetailsPage);



export default adminRoutes;
