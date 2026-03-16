import jwt from "jsonwebtoken";
import collection from "../config/collection.js";
import connectToDatabase from "../config/db.js";

export const verifyUser = async (req, res, next) => {
    try {
        const token = req.cookies.token; 
        if (!token) {
            req.loggedInUser = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Connect to DB to get the latest counts
        const db = await connectToDatabase(process.env.DATABASE);
        const user = await db.collection(collection.USERS_COLLECTION).findOne({ userId: decoded.id });

        if (user) {
            req.loggedInUser = {
                id: user.userId,
                name: user.name,
                email: user.email,
                // Dynamically calculate lengths of the arrays
                cartCount: user.cart ? user.cart.length : 0,
                wishlistCount: user.wishlist ? user.wishlist.length : 0
            };
        } else {
            req.loggedInUser = null;
        }
        
        next();
    } catch (err) {
        console.error("User token verification failed:", err.message);
        req.loggedInUser = null;
        next();
    }
};