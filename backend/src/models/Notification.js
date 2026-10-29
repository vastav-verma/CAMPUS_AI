import mongoose from "mongoose";

import { NOTIFICATION_TYPES } from "../constants/complaint.constants.js";

const notificationSchema = new mongoose.Schema(
    {
        collegeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: true,
            index: true
        },

        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        complaintId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Complaint",
            required: true
        },

        type: {
            type: String,
            enum: NOTIFICATION_TYPES,
            default: "status_updated"
        },

        title: {
            type: String,
            required: true
        },

        message: {
            type: String,
            required: true
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

notificationSchema.index({
    collegeId: 1,
    recipientId: 1,
    createdAt: -1
});

notificationSchema.index({
    recipientId: 1,
    isRead: 1
});

export default mongoose.model("Notification", notificationSchema);
