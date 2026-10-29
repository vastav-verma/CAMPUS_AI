import express from "express";
import rateLimit from "express-rate-limit";

import {
    signup,
    checkCode,
    suggestCodeEndpoint,
    getCollegeBranding,
    getInvite,
    acceptInvite
} from "../controllers/public.controller.js";

const router = express.Router();

const limiter = (max, windowMinutes) =>
    rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: "Too many requests. Please try again later."
        }
    });

router.post("/signup", limiter(10, 60), signup);
router.post("/invites/:token/accept", limiter(30, 60), acceptInvite);

router.get("/invites/:token", limiter(120, 15), getInvite);
router.get("/college-code/suggest", limiter(120, 15), suggestCodeEndpoint);
router.get("/college-code/:code", limiter(120, 15), checkCode);
router.get("/colleges/:code", limiter(120, 15), getCollegeBranding);

export default router;
