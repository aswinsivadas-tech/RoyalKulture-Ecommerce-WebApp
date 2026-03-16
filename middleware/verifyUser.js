// middleware/verifyUser.js
import collection from "../config/collection.js";
import connectToDatabase from "../config/db.js";
import jwt from "jsonwebtoken";

export const verifyUser = async (req, res, next) => {
    try {
        const token = req.cookies.token; 
        if (!token) {
            req.loggedInUser = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const db = await connectToDatabase(process.env.DATABASE);
        
        // Fetch user to get live cart and wishlist lengths
        const user = await db.collection(collection.USERS_COLLECTION).findOne({ userId: decoded.id });

        if (user) {
            req.loggedInUser = {
                id: user.userId,
                name: user.name,
                email: user.email,
                // These counts will now update on every page load/refresh
                cartCount: user.cart ? user.cart.length : 0,
                wishlistCount: user.wishlist ? user.wishlist.length : 0
            };
        }

        next();
    } catch (err) {
        req.loggedInUser = null;
        next();
    }
};