import express from "express";

import {
    chat,
    getChats,
    getSingleChat,
    removeChat
} from "../controllers/chat.controller.js";

import protect
    from "../middleware/auth.middleware.js";

import attachTenant
    from "../middleware/tenant.middleware.js";


const router =
    express.Router();


// ==========================================
// CHAT
// ==========================================

router.post(

    "/",

    protect,

    attachTenant,

    chat
);


// ==========================================
// GET ALL USER CHATS
// ==========================================

router.get(

    "/",

    protect,

    attachTenant,

    getChats
);


// ==========================================
// GET SINGLE CHAT
// ==========================================

router.get(

    "/:id",

    protect,

    attachTenant,

    getSingleChat
);


// ==========================================
// DELETE CHAT
// ==========================================

router.delete(

    "/:id",

    protect,

    attachTenant,

    removeChat
);


export default router;