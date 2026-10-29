import Notification from "../models/Notification.js";
import AppError from "../utils/AppError.js";

const scope = (req) => ({
    collegeId: req.tenant.collegeId,
    recipientId: req.user.userId
});

const getNotifications = async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
        Math.max(parseInt(req.query.limit, 10) || 20, 1),
        50
    );

    const filter = scope(req);

    if (req.query.unread === "true") {
        filter.isRead = false;
    }

    const [items, total, unreadCount] = await Promise.all([
        Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Notification.countDocuments(filter),
        Notification.countDocuments({ ...scope(req), isRead: false })
    ]);

    res.json({
        success: true,
        data: items,
        unreadCount,
        pagination: {
            page,
            limit,
            total,
            pages: Math.max(Math.ceil(total / limit), 1)
        }
    });
};

const getUnreadCount = async (req, res) => {
    const count = await Notification.countDocuments({
        ...scope(req),
        isRead: false
    });

    res.json({ success: true, data: { count } });
};

const markNotificationRead = async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
        throw new AppError("Invalid notification ID.", 400);
    }

    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, ...scope(req) },
        { $set: { isRead: true } },
        { new: true }
    );

    if (!notification) {
        throw new AppError("Notification not found.", 404);
    }

    res.json({ success: true, data: notification });
};

const markAllNotificationsRead = async (req, res) => {
    const result = await Notification.updateMany(
        { ...scope(req), isRead: false },
        { $set: { isRead: true } }
    );

    res.json({
        success: true,
        data: { updated: result.modifiedCount }
    });
};

export {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead
};
