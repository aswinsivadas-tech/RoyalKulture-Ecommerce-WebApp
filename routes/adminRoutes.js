import express from "express";
import { adminLogin } from "../controllers/adminAuth.js";


import {
  adminLoginPage,
  adminDashboardPage,
    adminAddProductPage,
      adminProductsListPage,
        adminOrdersListPage,
        adminUsersListPage,
          adminProductEditPage,
            updateOrderStatus,
            adminOrderDetailsPage,
              adminLogout,
            


} from "../controllers/adminController.js";

const adminRoutes = express.Router({ mergeParams: true });

adminRoutes.get("/", adminLoginPage);

adminRoutes.post("/login", adminLogin);

adminRoutes.get("/dashboard", adminDashboardPage);

adminRoutes.get("/add-product", adminAddProductPage);

adminRoutes.get("/products-list", adminProductsListPage);

adminRoutes.get("/orders-list", adminOrdersListPage);

adminRoutes.get("/users-list", adminUsersListPage);

adminRoutes.get("/products/edit/:id", adminProductEditPage);

adminRoutes.get("/update-order-status/:id/:status", updateOrderStatus);

adminRoutes.get("/orders/:id", adminOrderDetailsPage);

adminRoutes.get("/logout", adminLogout);




export default adminRoutes;
