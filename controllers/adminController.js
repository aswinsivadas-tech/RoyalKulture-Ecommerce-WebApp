import { ObjectId } from "mongodb";
import collection from "../config/collection.js";
import connectToDatabase from "../config/db.js";
// import { getProductsData } from "./productController.js";

export const adminLoginPage = async (req, res) => {
  // console.log("Admin dashboard route working 🚀");
    // res.status(200).json({ message: "Admin dashboard route working 🚀" });

  res.render("admin/adminLogin", { layout: "admin", title: "Admin Login" });
};



export const adminDashboardPage = async (req, res) => {
  try {
    const db = await connectToDatabase(process.env.DATABASE);

    const now = new Date();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 1️⃣ Total Delivered Orders (This Month)
    const deliveredOrdersCount = await db
      .collection(collection.ORDERS_COLLECTION)
      .countDocuments({
        status: "Delivered",
        createdAt: { $gte: startOfMonth, $lte: now },
      });

    // 2️⃣ Total Revenue from Delivered Orders (This Month)
    const revenueData = await db
      .collection(collection.ORDERS_COLLECTION)
      .aggregate([
        {
          $match: {
            status: "Delivered",
            createdAt: { $gte: startOfMonth, $lte: now },
          },
        },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
      ])
      .toArray();
    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // 3️⃣ Total Products Sold (This Month)
    const productData = await db
      .collection(collection.ORDERS_COLLECTION)
      .aggregate([
        {
          $match: {
            status: "Delivered",
            createdAt: { $gte: startOfMonth, $lte: now },
          },
        },
        { $unwind: "$cart" },
        {
          $group: { _id: null, totalProductsSold: { $sum: "$cart.quantity" } },
        },
      ])
      .toArray();
    const totalProductsSold = productData[0]?.totalProductsSold || 0;

    // ✅ 4️⃣ Total Registered Users (All-Time)
    const totalUsers = await db
      .collection(collection.USERS_COLLECTION)
      .countDocuments();

    // ✅ 5️⃣ Users Who Placed Orders (All-Time)
    const activeUsersData = await db
      .collection(collection.ORDERS_COLLECTION)
      .distinct("userId");
    const usersWhoOrdered = activeUsersData.length;

    // 6️⃣ Donut Chart Data: Order Status Counts (This Month)
    const statusData = await db
      .collection(collection.ORDERS_COLLECTION)
      .aggregate([
        { $match: { createdAt: { $gte: startOfMonth, $lte: now } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray();

    const donutLabels = statusData.map((item) => item._id);
    const donutData = statusData.map((item) => item.count);

    // 7️⃣ Daily Men vs Women Orders (Last 30 Days, any status)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0); // start of day

    // Generate last 30 days labels
    const last30Days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const day = String(d.getDate()).padStart(2, "0");
      const month = d.toLocaleString("default", { month: "short" });
      last30Days.push(`${day}/${month}`);
    }

    // Aggregation
    const dailyOrders = await db
      .collection(collection.ORDERS_COLLECTION)
      .aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo, $lte: now } } },
        { $unwind: "$cart" },
        {
          $addFields: {
            productObjId: {
              $cond: {
                if: { $eq: [{ $type: "$cart.productId" }, "string"] },
                then: { $toObjectId: "$cart.productId" },
                else: "$cart.productId",
              },
            },
          },
        },
        {
          $lookup: {
            from: collection.PRODUCTS_COLLECTION,
            localField: "productObjId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: {
              orderId: "$_id",
              date: {
                $dateToString: {
                  format: "%d/%b",
                  date: "$createdAt",
                  timezone: "Asia/Kolkata",
                },
              },
            },
            categories: { $addToSet: "$productDetails.category" },
          },
        },
        { $unwind: "$categories" },
        {
          $group: {
            _id: {
              date: "$_id.date",
              category: "$categories",
            },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
      ])
      .toArray();

    // Map aggregation to last 30 days
    const menData = last30Days.map((day) => {
      const dayData = dailyOrders.find(
        (d) => d._id.date === day && d._id.category.toLowerCase() === "men"
      );
      return dayData ? dayData.orderCount : 0;
    });

    const womenData = last30Days.map((day) => {
      const dayData = dailyOrders.find(
        (d) => d._id.date === day && d._id.category.toLowerCase() === "women"
      );
      return dayData ? dayData.orderCount : 0;
    });

    // console.log("wormnesData>>>>",womenData);
    // console.log("mnesData>>>>", menData);
    // console.log("LabesData>>>>",last30Days);

    // Render dashboard
    res.render("admin/dashboard", {
      layout: "admin",
      title: "Admin Dashboard",
      totalRevenue: totalRevenue.toFixed(2),
      deliveredOrdersCount,
      totalProductsSold,
      totalUsers,
      usersWhoOrdered,
      donutLabels: JSON.stringify(donutLabels),
      donutData: JSON.stringify(donutData),
      lineLabels: JSON.stringify(last30Days),
      menData: JSON.stringify(menData),
      womenData: JSON.stringify(womenData),
    });
  } catch (error) {
    // console.error("Error loading admin dashboard:", error);
    res.status(500).send("Something went wrong loading the dashboard.");
  }
};
