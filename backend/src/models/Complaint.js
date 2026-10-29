import mongoose from "mongoose";

import {
    CATEGORIES,
    SEVERITIES,
    STATUSES
} from "../constants/complaint.constants.js";

const statusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: STATUSES,
            required: true
        },
        // null => action performed automatically by the system
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        note: {
            type: String,
            default: "",
            maxlength: 2000
        },
        at: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

const proofSchema = new mongoose.Schema(
    {
        storageKey: { type: String, required: true },
        originalName: { type: String, default: "" },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true }
    },
    { _id: false }
);

const complaintSchema = new mongoose.Schema(
    {
        collegeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: true,
            index: true
        },

        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        assignedAt: {
            type: Date,
            default: null
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000
        },

        category: {
            type: String,
            enum: CATEGORIES,
            required: true
        },

        severity: {
            type: String,
            enum: SEVERITIES,
            default: "medium"
        },

        status: {
            type: String,
            enum: STATUSES,
            default: "submitted"
        },

        resolutionRemarks: {
            type: String,
            default: "",
            maxlength: 2000
        },

        // Optional image evidence uploaded by the resolver.
        proof: {
            type: proofSchema,
            default: null
        },

        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        resolvedAt: {
            type: Date,
            default: null
        },

        reopenCount: {
            type: Number,
            default: 0
        },

        statusHistory: {
            type: [statusHistorySchema],
            default: []
        }
    },
    { timestamps: true }
);

complaintSchema.index({
    collegeId: 1,
    studentId: 1,
    createdAt: -1
});

complaintSchema.index({
    collegeId: 1,
    assignedTo: 1,
    status: 1,
    createdAt: -1
});

complaintSchema.index({
    collegeId: 1,
    status: 1,
    createdAt: -1
});

export default mongoose.model("Complaint", complaintSchema);
