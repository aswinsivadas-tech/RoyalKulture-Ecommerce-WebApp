import express from "express";

import {
  addToCart,
  addToWishlist,
  cartPage,
  checkoutPage,
  clearCart,
  createAddress,
  getAccount,
  getOrderHistory,
  getWishlistPage,
  landingPage,
  loginPage,
  orderSuccess,
  placeOrder,
  productsPage,
  removeFromCart,
  removeFromWishlist,
  signupPage,
  updateAccount,
} from "../controllers/userController.js";
import { productDeatilsPage } from "../controllers/productController";

import {
  createUser,
  loginUser,
  logout,
} from "../controllers/authController.js";


const userRoutes = express.Router({ mergeParams: true });


