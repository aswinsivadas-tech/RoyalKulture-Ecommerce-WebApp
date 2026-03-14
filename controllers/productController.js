import { ObjectId } from "mongodb";
import collection from "../config/collection.js";
import connectToDatabase from "../config/db.js";
import { v7 as uuidv7 } from "uuid";
import { error } from "console";

/* Create a new product */
export const createProduct = async (req, res) => {
  // console.log("crete produt route working>>>>>>>>");
  try {
    const data = req.body;
    // console.log(data);

    console.log(req.files); // array of files
    const pictures = req.files.map(
      (file) => `/userAssets/pictures/${file.filename}`
    );
    // console.log(pictures);

    const productData = {
      name: data.name,
      shortDesc: data.shortDesc,
      description: data.description,
      category: data.category,
      brand: data.brand,
      price: parseInt(data.price),
      discountPrice: parseInt(data.discountPrice),
      stock: parseInt(data.stock),
      rating: "",
      picturePath: pictures,
      thumbnail: "",
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDelete: false,
    };

    // console.log(productData);

    const db = await connectToDatabase(process.env.DATABASE);
    const result = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .insertOne(productData);
    // console.log(result);

    return res.redirect("/admin/products-list");
  } catch (error) {
    // console.log(error);
  }
};

/**
 * Fetch products from the database with optional filters, sorting, and limit
 * @param {Object} options - Options for fetching products
 * @param {string} [options.category] - Filter by category (e.g. "men", "women")
 * @param {string} [options.brand] - Filter by brand (e.g. "Rolex")
 * @param {string} [options.sort] - Sort type ("latest", "oldest", "random")
 * @param {number} [options.limit] - Max number of products to return
 * @returns {Promise<Array>} - Array of products
 */
export const getProductsData = async (options = {}) => {
  try {
    const db = await connectToDatabase(process.env.DATABASE);

    // Build filter dynamically
    const filter = { isDelete: false };
    if (options.category) filter.category = options.category;
    if (options.brand) filter.brand = options.brand;

    let products;

    // If sort = random → use aggregation to return random products
    if (options.sort === "random") {
      products = await db
        .collection(collection.PRODUCTS_COLLECTION)
        .aggregate([
          { $match: filter }, // Apply filters
          { $sample: { size: options.limit || 20 } }, // Random selection
        ])
        .toArray();
    } else {
      // Sort by creation date
      let sortOption = { createdAt: -1 }; // latest first by default
      if (options.sort === "oldest") sortOption = { createdAt: 1 };

      let query = db
        .collection(collection.PRODUCTS_COLLECTION)
        .find(filter)
        .sort(sortOption);

      if (options.limit) {
        query = query.limit(parseInt(options.limit));
      }

      products = await query.toArray();
    }

    return products; // always returns a Promise
  } catch (error) {
    // console.error("❌ Error in getProducts:", error);
    throw error;
  }
};

export const productViewPage = async (req, res) => {
  // console.log("✅ Product view route hit");

  try {
    const db = await connectToDatabase(process.env.DATABASE);

    // Step 1: Check if ID is received in URL
    const productId = req.query.id;
    // console.log("🆔 Product ID from URL:", productId);

    if (!productId) {
      // console.log("❌ No product ID provided in URL");
      return res.status(400).send("Product ID is required");
    }

    // Step 2: Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      // console.log("❌ Invalid ObjectId:", productId);
      return res.status(400).send("Invalid product ID");
    }

    // Step 3: Fetch product from DB
    const product = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ _id: new ObjectId(String(productId)) });

    // console.log(">>>>>>>>Product Data",product);

    if (!product) {
      // console.log("❌ Product not found in database");
      return res.status(404).send("Product not found");
    }

    // Step 5: Render product view
    res.redierect("user/home", {
      title: `Product`,
    });
  } catch (error) {
    // console.error("❌ Error in productViewPage:", error);
    res.status(500).send("Server error");
  }
};

export const productDeatilsPage = async (req, res) => {
  // console.log("product Deatils function called");
  try {
    const db = await connectToDatabase(process.env.DATABASE);

    // Step 1: Check if ID is received in URL
    const productId = req.query.id;
    // console.log("🆔 Product ID from URL:", productId);

    if (!productId) {
      // console.log("❌ No product ID provided in URL");
      return res.status(400).send("Product ID is required");
    }

    // Step 2: Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      // console.log("❌ Invalid ObjectId:", productId);
      return res.status(400).send("Invalid product ID");
    }

    // Step 3: Fetch product from DB
    const product = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ _id: new ObjectId(String(productId)) });

    if (!product) {
      // console.log("❌ Product not found in database");
      return res.status(404).send("Product not found");
    }

    // Step 4: Add stock status logic
    let stockStatus = "";
    if (product.stock > 20) {
      stockStatus = `🟢 Available only ${product.stock}`;
    } else if (product.stock > 0 && product.stock <= 20) {
      stockStatus = `🟠Hurry up! Only ${product.stock} left`;
    } else {
      stockStatus = " 🔴Currently unavailable";
    }

    // Step 5: Fetch related products
    const relatedProducts = await getProductsData({
      category: product.category,
      limit: 4,
    });

    // Step 6: Render view
    res.render("user/productDetails", {
      title: `Product - ${product.name}`,
      product,
      relatedProducts,
      stockStatus, // send to template
    });
  } catch (error) {
    // console.error("❌ Error in productDetailsPage:", error);
    res.status(500).send("Server Error");
  }
};

export const deleteProduct = async (req, res) => {
  // console.log("delete product route called>>>>>>>>>");

  try {
    const productId = req.params.id; // fixed typo
    // console.log("Product ID:", productId);

    const db = await connectToDatabase(process.env.DATABASE);
    const product = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ _id: new ObjectId(productId) }); // findOne + ObjectId

    if (!product) {
      return res.render("admin/products-list", {
        title: "Admin - Product List",
        error: "Product not found.",
      });
    }

    // Soft delete: set isDelete = true
    await db.collection(collection.PRODUCTS_COLLECTION).updateOne(
      { _id: new ObjectId(String(productId)) },
      { $set: { isDelete: true } } 
    );

    res.redirect("/admin/products-list");
  } catch (error) {
    // console.error("Error deleting product:", error);
    res.status(500).send("Something went wrong while deleting the product.");
  }
};


export const editProductDetails = async (req, res) => {   
  // console.log("edit Product details function triggered >>>>");
  // console.log(req.body);
  // console.log(req.params.id);

  try {
    const productId = req.params.id;
    const updatedData = {
      name: req.body.name,
      brand: req.body.brand,
      category: req.body.category,
      status: req.body.status,
      price: Number(req.body.price),
      discountPrice: Number(req.body.discountPrice),
      stock: Number(req.body.stock),
      shortDesc: req.body.shortDesc,
      description: req.body.description,
      updatedAt: new Date()
    };

    const db = await connectToDatabase(process.env.DATABASE);

    const result = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .updateOne(
        { _id: new ObjectId(productId) },
        { $set: updatedData } // ✅ Only update given fields, images untouched
      );

    // console.log("Update result:", result);

    res.redirect("/admin/products-list");  // or respond with JSON

  } catch (error) {
    // console.error("Error updating product:", error);
    res.status(500).send("Internal Server Error");
  }
};

