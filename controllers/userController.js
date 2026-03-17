import { ObjectId } from "mongodb";
import collection from "../config/collection.js";
import connectToDatabase from "../config/db.js";
import { bannerData, brandData } from "../data/index.js";
import { getProductsData } from "./productController.js";
import { createUser } from "./authController.js";
import bcrypt from "bcrypt";
import { v7 as uuidv7 } from "uuid";
import jwt from "jsonwebtoken";

export const productsPage = async (req, res) => {
  try {
    // ✅ Get logged-in user from JWT cookie
    let user = null;
    const token = req.cookies?.token;
    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        user = null; // Invalid token, treat as guest
      }
    }

    // Fetch 20 latest products
    const products = await getProductsData({
      sort: "latest",
      limit: 20,
    });

    // Add stock status to each product
    const productsWithStock = products.map((product) => ({
      ...product,
      stockStatus: getStockStatus(product),
    }));

    // Render the products page
    res.render("user/products", {
      title: "Product's List - RoyalKulture",
      products: productsWithStock, // send data with stock status
      user, // ✅ Pass user to HBS
    });
  } catch (error) {
    console.error("❌ Error loading products page:", error);
    res.status(500).send("Error loading products page");
  }
};

// Stock status helper function
const getStockStatus = (product) => {
  if (product.stock > 20) {
    return `🟢 Available (${product.stock})`;
  } else if (product.stock > 0 && product.stock <= 20) {
    return `🟠 Hurry up! Only ${product.stock} left`;
  } else {
    return `🔴 Currently unavailable`;
  }
};

export const blockUnblockUser = async (req, res) => {

  try {
    const db = await connectToDatabase(process.env.DATABASE);
    const userId = req.params.id; // user id from params
    const { status } = req.query; // status from query true/false

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const isBlock = status === "true"; // convert query string to boolean

    // Prepare update data (no blockedAt)
    const updateData = {
      isBlocked: isBlock,
      isActive: !isBlock,
      updatedAt: new Date(),
    };

    const result = await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ _id: new ObjectId(userId) }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // res.status(200).json({
    //   message: isBlock ? "User blocked successfully" : "User unblocked successfully",
    // });

    res.redirect("/admin/users-list");
  } catch (error) {
    console.error("Block/Unblock User Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const landingPage = async (req, res) => {

  try {

    // Fetch different product sets
    const featuredProducts = await getProductsData({
      sort: "random",
      limit: 12,
    });

    const latestMen = await getProductsData({
      category: "men",
      sort: "latest",
      limit: 10,
    });

    const latestWomen = await getProductsData({
      category: "women",
      sort: "latest",
      limit: 10,
    });

    const newArrivals = await getProductsData({
      sort: "latest",
      limit: 15,
    });

    // Function to generate stock status
    const getStockStatus = (product) => {
      if (product.stock > 20) {
        return `🟢 Available (${product.stock})`;
      } else if (product.stock > 0 && product.stock <= 20) {
        return `🟠 Hurry up! Only ${product.stock} left`;
      } else {
        return `🔴 Currently unavailable`;
      }
    };
     let user = null;
const token = req.cookies?.token;
if (token) {
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log("Invalid JWT:", err.message);
    user = null;
  }
}
// console.log("Logged-in user:", user);
    // Add stock status to all product lists
    const addStockStatus = (products) =>
      products.map((product) => ({
        ...product,
        stockStatus: getStockStatus(product),
      }));

    const featuredWithStock = addStockStatus(featuredProducts);
    const menWithStock = addStockStatus(latestMen);
    const womenWithStock = addStockStatus(latestWomen);
    const newArrivalsWithStock = addStockStatus(newArrivals);

    // Render homepage with dynamic products + stock info
    res.render("user/home", {
      title: "Home - RoyalKulture",
      banners: bannerData,
      brands: brandData,
      featured: featuredWithStock,
      men: menWithStock,
      women: womenWithStock,
      newProducts: newArrivalsWithStock,
       user,
    });
  } catch (error) {
    // console.error("❌ Landing page error:", error);
    res.status(500).send("Error loading home page");
  }
};

export const loginPage = async (req, res) => {
  // console.log("Login page route working 🚀");
  try {
    res.render("user/login", { title: "Login - RoyalKulture" });
  } catch (error) {
    // console.log(error);
  }
};

export const signupPage = async (req, res) => {
 
  try {
    createUser;
    res.render("user/signup", { title: "Signup - RoyalKulture" });
  } catch (error) {
    // console.log(error);
  }
};

export const cartPage = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    const db = await connectToDatabase(process.env.DATABASE);

    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });

    const cart = user.cart || [];

    // Calculate cart totals
    const subtotal = cart.reduce((acc, item) => acc + item.total, 0);

    res.render("user/cart", {
      title: "Your Cart",
      cart,
      subtotal,
    });
  } catch (error) {
    // console.log(error);
    res.send("Something went wrong");
  }
};

//add cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    const { productId, quantity, redirect } = req.body;

    const db = await connectToDatabase(process.env.DATABASE);
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });
    const product = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ _id: new ObjectId(String(productId)) });

    if (!product) {
      return res.render("user/productDetails", {
        product: null,
        error: "Product not found.",
      });
    }

    const qty = parseInt(quantity);
    const existingItem = user.cart?.find(
      (item) => item.productId === productId
    );
    const totalRequested = existingItem ? existingItem.quantity + qty : qty;

    if (totalRequested > product.stock) {
      return res.render("user/productDetails", {
        product,
        error: `Cannot add ${qty} items. Only ${
          product.stock - (existingItem ? existingItem.quantity : 0)
        } left in stock.`,
      });
    }

    // Calculate price & discount
    const price = product.discountPrice || product.price; // Use discounted price if exists
    const itemTotal = price * qty;

    if (existingItem) {
      await db.collection(collection.USERS_COLLECTION).updateOne(
        { userId, "cart.productId": productId },
        {
          $inc: {
            "cart.$.quantity": qty,
            "cart.$.total": itemTotal,
          },
        }
      );
    } else {
      const newItem = {
        productId,
        name: product.name,
        brand: product.brand,
        price, // discounted price
        quantity: qty,
        image:
          product.picturePath?.[0] || "/userAssets/imgs/default-product.png",
        picturePath: product.picturePath || [],
        total: itemTotal,
        addedAt: new Date(),
      };

      await db
        .collection(collection.USERS_COLLECTION)
        .updateOne({ userId }, { $push: { cart: newItem } });
    }

    // Remove from wishlist if present
    await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ userId }, { $pull: { wishlist: { productId } } });

    res.redirect(redirect || "/cart");
  } catch (error) {
    // console.error(error);
    res.redirect("/wishlist");
  }
};

//clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    if (!userId) {
      return res.redirect("/login");
    }

    const db = await connectToDatabase(process.env.DATABASE);

    // Clear the cart array
    await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ userId }, { $set: { cart: [] } });

    res.redirect("/"); // redirect back to landing page
  } catch (error) {
    // console.log("Error clearing cart:", error);
    res.status(500).send("Something went wrong while clearing the cart");
  }
};

//remove selected product from cart

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    const { productId } = req.params;

    if (!userId) {
      return res.redirect("/login");
    }

    const db = await connectToDatabase(process.env.DATABASE);

    // Remove the item from the cart array
    await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ userId }, { $pull: { cart: { productId: productId } } });

    res.redirect("/cart"); // Redirect back to landing page
  } catch (error) {
    // console.log("Error removing item from cart:", error);
    res.status(500).send("Something went wrong");
  }
};

//checkout page

export const checkoutPage = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    if (!userId) {
      return res.redirect("/login");
    }

    const db = await connectToDatabase(process.env.DATABASE);
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });

    const cart = user.cart || [];
    const addresses = user.addresses || []; // ✅ Get saved addresses

    // Calculate total
    const total = cart.reduce((acc, item) => acc + item.total, 0);

    res.render("user/checkout", {
      title: "Checkout",
      cart,
      total,
      addresses, // ✅ Pass to HBS
    });
  } catch (error) {
    // console.error(error);
    res.send("Something went wrong");
  }
};

/// checkout page addresss
export const createAddress = async (req, res) => {
  
  try {
    const userId = req.loggedInUser?.id;
    
    if (!userId) {
      return res.redirect("/login");
    }

    const { billingName, address, landmark, phone } = req.body;

    if (!billingName || !address || !phone) {
      // console.log("❌ Required fields missing");
      return res.status(400).send("All required fields must be filled");
    }

    const db = await connectToDatabase(process.env.DATABASE);
    // console.log("✅ Database connected");

    // ✅ IMPORTANT: Match using userId instead of _id
    const result = await db.collection(collection.USERS_COLLECTION).updateOne(
      { userId: userId },
      {
        $push: {
          addresses: {
            billingName,
            address,
            landmark: landmark || "",
            phone,
            createdAt: new Date(),
          },
        },
      }
    );

    // console.log("Update Result:", {
    //   matched: result.matchedCount,
    //   modified: result.modifiedCount,
    // });

    if (result.modifiedCount === 0) {
      // console.log("⚠️ Address not added. Possible wrong userId match.");
      return res.status(500).send("Failed to add address");
    }

    // console.log("✅ Address added successfully. Redirecting...");
    res.redirect("/checkout");
  } catch (error) {
    // console.error("🔥 Error creating address:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const placeOrder = async (req, res) => {
  
  try {
    const userId = req.loggedInUser?.id;
    if (!userId) return res.redirect("/login");

    const db = await connectToDatabase(process.env.DATABASE);

    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });
    if (!user) return res.status(404).send("User not found");

    const cart = user.cart || [];
    if (cart.length === 0) return res.redirect("/cart");

    // Handle address
    let orderAddress;
    if (user.addresses?.length && req.body.selectedAddress !== undefined) {
      const index = parseInt(req.body.selectedAddress);
      orderAddress = user.addresses[index];
    } else if (req.body.billingName && req.body.address && req.body.phone) {
      orderAddress = {
        billingName: req.body.billingName,
        address: req.body.address,
        landmark: req.body.landmark || "",
        phone: req.body.phone,
        createdAt: new Date(),
      };
      await db
        .collection(collection.USERS_COLLECTION)
        .updateOne({ userId }, { $push: { addresses: orderAddress } });
    } else {
      return res.status(400).send("Address details missing");
    }

    // ----- STOCK CHECK -----
    for (let item of cart) {
      const product = await db
        .collection(collection.PRODUCTS_COLLECTION)
        .findOne({ _id: new ObjectId(item.productId) });

      if (!product) {
        return res
          .status(404)
          .send(`Product ${item.name} not found in database`);
      }

      if (product.stock === undefined || product.stock < item.quantity) {
        return res
          .status(400)
          .send(`Not enough stock for product: ${item.name}`);
      }
    }

    // ----- DEDUCT STOCK -----
    for (let item of cart) {
      await db.collection(collection.PRODUCTS_COLLECTION).updateOne(
        { _id: new ObjectId(item.productId) },
        { $inc: { stock: -item.quantity } } // decrement stock
      );
    }

    // ----- CREATE ORDER -----
    const order = {
      orderId: uuidv7(),
      userId,
      cart,
      address: orderAddress,
      paymentMethod: req.body.payment_option,
      total: cart.reduce((acc, item) => acc + item.total, 0),
      status: req.body.payment_option === "COD" ? "Pending" : "Paid",
      createdAt: new Date(),
    };

    const result = await db
      .collection(collection.ORDERS_COLLECTION)
      .insertOne(order);
    const orderId = result.insertedId;

    await db.collection(collection.USERS_COLLECTION).updateOne(
      { userId },
      { $push: { orders: orderId }, $set: { cart: [] } } // add order and clear cart
    );

    res.redirect("/order-success");
  } catch (error) {
    // console.error("🔥 Error placing order:", error);
    res.status(500).send("Something went wrong while placing the order.");
  }
};

export const orderSuccess = async (req, res) => {

  try {
    const userId = req.loggedInUser?.id;
    if (!userId) return res.redirect("/login");

    const db = await connectToDatabase(process.env.DATABASE);

    // Fetch the last order for this user
    const lastOrder = await db
      .collection(collection.ORDERS_COLLECTION)
      .findOne({ userId }, { sort: { createdAt: -1 } });

    if (!lastOrder) {
      // console.log("No order found for this user.");
      return res.redirect("/");
    }

    // Ensure each cart item has a total
    const cartWithTotal = lastOrder.cart.map((item) => ({
      ...item,
      total: item.total || item.price * item.quantity,
    }));

    // Calculate total order amount
    const totalAmount = cartWithTotal.reduce(
      (acc, item) => acc + item.total,
      0
    );

    res.render("user/orderSuccess", {
      orderId: lastOrder._id,
      email: req.loggedInUser.email,
      billingName: lastOrder.address.billingName,
      address: lastOrder.address.address,
      landmark: lastOrder.address.landmark,
      phone: lastOrder.address.phone,
      cart: cartWithTotal,
      total: totalAmount,
    });
  } catch (error) {
    // console.error("Error rendering order success page:", error);
    res
      .status(500)
      .send("Something went wrong while loading the order success page.");
  }
};

export const getOrderHistory = async (req, res) => {

  try {
    const userId = req.loggedInUser?.id;
    if (!userId) return res.redirect("/login");

    // Connect to database
    const db = await connectToDatabase(process.env.DATABASE);

    // Fetch all orders for this user, newest first
    const orders = await db
      .collection(collection.ORDERS_COLLECTION)
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    if (!orders || orders.length === 0) {
      // console.log("No orders found for this user.");
      return res.render("user/order-history", { orders: [] });
    }

    // Format orders: add cart totals and full totalAmount per order
    const formattedOrders = orders.map((order) => {
      const cartWithTotal = order.cart.map((item) => ({
        ...item,
        total: item.total || item.price * item.quantity,
      }));

      const totalAmount = cartWithTotal.reduce(
        (acc, item) => acc + item.total,
        0
      );

      return {
        ...order,
        cart: cartWithTotal,
        totalAmount,
      };
    });

    // ✅ Render the correct view inside "views/user/order-history.hbs"
    res.render("user/order-history", { orders: formattedOrders });
  } catch (error) {
    // console.error("Error loading order history page:", error);
    res.status(500).send("Something went wrong while loading order history.");
  }
};

// GET account page
export const getAccount = async (req, res) => {
  try {
    const db = await connectToDatabase(process.env.DATABASE);
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId: req.loggedInUser.id });

    res.render("user/account-details", {
      title: "Account Details",
      user, // send user data to prefill form
    });
  } catch (err) {
    // console.error(err);
    res.render("user/account-details", {
      title: "Account Details",
      error: "Failed to load account details.",
    });
  }
};

// POST update account
export const updateAccount = async (req, res) => {
  try {
    const { name, phone, dname, email, password, npassword, cpassword } =
      req.body;
    const userId = req.loggedInUser.id;

    const db = await connectToDatabase(process.env.DATABASE);
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });

    if (!user) {
      return res.render("user/account-details", {
        title: "Account Details",
        error: "User not found.",
      });
    }

    // ✅ Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      password,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.render("user/account-details", {
        title: "Account Details",
        error: "Current password is incorrect.",
        user,
      });
    }

    // ✅ Handle new password (optional)
    let hashedPassword = user.password;
    if (npassword || cpassword) {
      if (npassword !== cpassword) {
        return res.render("user/account-details", {
          title: "Account Details",
          error: "New password and confirm password do not match.",
          user,
        });
      }
      hashedPassword = await bcrypt.hash(npassword, 10);
    }

    // ✅ Update user details
    await db.collection(collection.USERS_COLLECTION).updateOne(
      { userId },
      {
        $set: { name, phone, dname, email, password: hashedPassword },
      }
    );

    const updatedUser = { ...user, name, phone, dname, email };
    res.render("user/account-details", {
      title: "Account Details",
      success: "Account updated successfully!",
      user: updatedUser,
    });
  } catch (err) {
    // console.error(err);
    res.render("user/account-details", {
      title: "Account Details",
      error: "Something went wrong. Please try again later.",
      user: req.body,
    });
  }
};

export const addToWishlist = async (req, res) => {
 
  try {
    const userId = req.loggedInUser?.id;
    const { productId } = req.body; // only productId

    const db = await connectToDatabase(process.env.DATABASE);
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });

    const exists = user.wishlist?.find((item) => item.productId === productId);

    if (!exists) {
      await db
        .collection(collection.USERS_COLLECTION)
        .updateOne(
          { userId },
          { $push: { wishlist: { productId, addedAt: new Date() } } }
        );
    }

    res.redirect("/wishlist");
  } catch (err) {
    // console.log(err);
    res.redirect("/wishlist");
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    let userId = req.loggedInUser?.id;
    const { productId } = req.body;

    const db = await connectToDatabase(process.env.DATABASE);
    await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ userId }, { $pull: { wishlist: { productId } } });

    res.redirect("/wishlist");
  } catch (error) {
    console.log(error);
    res.redirect("/wishlist");
  }
};

export const getWishlistPage = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    if (!userId) return res.redirect("/login");

    const db = await connectToDatabase(process.env.DATABASE);
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });

    const wishlistItems = user?.wishlist || [];
    if (!wishlistItems.length)
      return res.render("user/wishlist", { wishlist: [] });

    const productIds = wishlistItems.map(
      (item) => new ObjectId(item.productId)
    );
    const products = await db
      .collection("products")
      .find({ _id: { $in: productIds } })
      .toArray();

    const wishlist = wishlistItems
      .map((item) => {
        const product = products.find(
          (p) => p._id.toString() === item.productId
        );
        if (!product) return null; // skip if product deleted

        return {
          productId: item.productId,
          name: product.name,
          brand: product.brand,
          price: product.discountPrice || product.price, // numeric
          image:
            product.picturePath?.[0] || "/userAssets/imgs/default-product.png",
          shortDescription: product.shortDescription || "",
          inStock: product.stock > 0,
        };
      })
      .filter(Boolean);

    // console.log("Wishlist to render:", wishlist);
    res.render("user/wishlist", { wishlist });
  } catch (err) {
    // console.error(err);
    res.redirect("/");
  }
};

// ==========================================
// INCREASE CART QUANTITY
// ==========================================
export const increaseCartQuantity = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    const { productId } = req.params; // Grabbing ID from the URL

    if (!userId) return res.redirect("/login");

    const db = await connectToDatabase(process.env.DATABASE);
    const user = await db.collection(collection.USERS_COLLECTION).findOne({ userId });

    if (user && user.cart) {
      const itemIndex = user.cart.findIndex((item) => item.productId === productId);

      if (itemIndex > -1) {
        // Find the actual product to make sure we don't exceed stock
        const product = await db.collection(collection.PRODUCTS_COLLECTION).findOne({ _id: new ObjectId(String(productId)) });

        if (product && user.cart[itemIndex].quantity < product.stock) {
          user.cart[itemIndex].quantity += 1; // Increase qty
          user.cart[itemIndex].total = user.cart[itemIndex].quantity * user.cart[itemIndex].price; // 🚨 DO THE MATH! 🚨

          // Save the updated cart to the database
          await db.collection(collection.USERS_COLLECTION).updateOne(
            { userId },
            { $set: { cart: user.cart } }
          );
        }
      }
    }
    res.redirect("/cart"); // Reload the page to show new numbers!
  } catch (error) {
    console.error("Error increasing cart quantity:", error);
    res.redirect("/cart");
  }
};

// ==========================================
// DECREASE CART QUANTITY
// ==========================================
export const decreaseCartQuantity = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    const { productId } = req.params;

    if (!userId) return res.redirect("/login");

    const db = await connectToDatabase(process.env.DATABASE);
    const user = await db.collection(collection.USERS_COLLECTION).findOne({ userId });

    if (user && user.cart) {
      const itemIndex = user.cart.findIndex((item) => item.productId === productId);

      if (itemIndex > -1) {
        // Only decrease if quantity is greater than 1
        if (user.cart[itemIndex].quantity > 1) {
          user.cart[itemIndex].quantity -= 1; // Decrease qty
          user.cart[itemIndex].total = user.cart[itemIndex].quantity * user.cart[itemIndex].price; // 🚨 DO THE MATH! 🚨

          // Save the updated cart to the database
          await db.collection(collection.USERS_COLLECTION).updateOne(
            { userId },
            { $set: { cart: user.cart } }
          );
        }
      }
    }
    res.redirect("/cart"); // Reload the page to show new numbers!
  } catch (error) {
    console.error("Error decreasing cart quantity:", error);
    res.redirect("/cart");
  }
};