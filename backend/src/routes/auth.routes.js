import express from "express";
import rateLimit from "express-rate-limit";

import {
    register,
    login,
    getMe,
    updatePassword
} from "../controllers/auth.controller.js";

import protect from "../middleware/auth.middleware.js";
import attachTenant from "../middleware/tenant.middleware.js";

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many attempts. Please try again in a few minutes."
    }
});

const router = express.Router();


router.post("/register", register);

router.post("/login", loginLimiter, login);

router.get(
    "/me",
    protect,
    attachTenant,
    getMe
);


router.patch(
    "/change-password",
    protect,
    attachTenant,
    updatePassword
);


export default router;