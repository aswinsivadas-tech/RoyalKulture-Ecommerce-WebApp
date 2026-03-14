import express from "express";
import { adminLogin } from "../controllers/adminAuth.js";

import {
  adminLoginPage,
  adminDashboardPage,
} from "../controllers/adminController.js";

const adminRoutes = express.Router({ mergeParams: true });

adminRoutes.get("/", adminLoginPage);
adminRoutes.post("login", adminLogin);

adminRoutes.get("/dashboard", adminDashboardPage);

export default adminRoutes;
