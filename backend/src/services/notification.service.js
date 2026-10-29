import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Notifications are a side effect. A failure here must never
// make the main action (submit / resolve / assign) fail, so we log
// the error and carry on.
const notify = async ({
    collegeId,
    recipientId,
    complaintId,
    type = "status_updated",
    title,
    message
}) => {
    if (!recipientId) return null;

    try {
        return await Notification.create({
            collegeId,
            recipientId,
            complaintId,
            type,
            title,
            message
        });
    } catch (error) {
        console.error("Notification failed:", error.message);
        return null;
    }
};

const notifyCollegeAdmins = async ({
    collegeId,
    complaintId,
    type,
    title,
    message
}) => {
    try {
        const admins = await User.find({
            collegeId,
            role: "college_admin",
            isActive: true
        })
            .select("_id")
            .lean();

        if (admins.length === 0) return;

        await Notification.insertMany(
            admins.map((admin) => ({
                collegeId,
                recipientId: admin._id,
                complaintId,
                type,
                title,
                message
            }))
        );
    } catch (error) {
        console.error("Admin notification failed:", error.message);
    }
};

// Kept for backward compatibility with older imports.
const createNotification = notify;

export { notify, notifyCollegeAdmins, createNotification };
