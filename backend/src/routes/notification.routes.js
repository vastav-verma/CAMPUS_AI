import express from "express";

import protect from "../middleware/auth.middleware.js";
import attachTenant from "../middleware/tenant.middleware.js";

import {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead
} from "../controllers/notification.controller.js";

const router = express.Router();

router.use(protect, attachTenant);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;
