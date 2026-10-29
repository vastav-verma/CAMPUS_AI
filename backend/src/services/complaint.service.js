import mongoose from "mongoose";

import Complaint from "../models/Complaint.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

import {
    CATEGORIES,
    SEVERITIES,
    STATUSES,
    MAX_REOPENS
} from "../constants/complaint.constants.js";

import { assignComplaint } from "./assignment.service.js";
import { notify, notifyCollegeAdmins } from "./notification.service.js";
import { saveProofImage, deleteStoredFile } from "./storage.service.js";

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------

const isId = (value) => /^[a-f\d]{24}$/i.test(String(value));

const assertId = (value, label = "ID") => {
    if (!isId(value)) {
        throw new AppError(`Invalid ${label}.`, 400);
    }
};

const idOf = (value) => String(value?._id ?? value ?? "");

const escapeRegex = (text) =>
    text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const LIST_POPULATE = [
    { path: "studentId", select: "name email" },
    { path: "assignedTo", select: "name email department" }
];

const DETAIL_POPULATE = [
    ...LIST_POPULATE,
    { path: "resolvedBy", select: "name" },
    { path: "statusHistory.changedBy", select: "name role" }
];

const parsePaging = (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(
        Math.max(parseInt(query.limit, 10) || 20, 1),
        50
    );

    return { page, limit, skip: (page - 1) * limit };
};

const applyFilters = (filter, query) => {
    if (query.status) {
        if (!STATUSES.includes(query.status)) {
            throw new AppError("Invalid status filter.", 400);
        }
        filter.status = query.status;
    }

    if (query.category) {
        if (!CATEGORIES.includes(query.category)) {
            throw new AppError("Invalid category filter.", 400);
        }
        filter.category = query.category;
    }

    if (query.severity) {
        if (!SEVERITIES.includes(query.severity)) {
            throw new AppError("Invalid severity filter.", 400);
        }
        filter.severity = query.severity;
    }

    if (query.q && String(query.q).trim()) {
        filter.title = {
            $regex: escapeRegex(String(query.q).trim().slice(0, 100)),
            $options: "i"
        };
    }

    return filter;
};

const paginate = async (filter, query) => {
    const { page, limit, skip } = parsePaging(query);

    const [items, total] = await Promise.all([
        Complaint.find(filter)
            .populate(LIST_POPULATE)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Complaint.countDocuments(filter)
    ]);

    return {
        items,
        pagination: {
            page,
            limit,
            total,
            pages: Math.max(Math.ceil(total / limit), 1)
        }
    };
};

const assertCanView = (complaint, user) => {
    if (user.role === "college_admin") return;

    if (
        user.role === "student" &&
        idOf(complaint.studentId) === String(user.userId)
    ) {
        return;
    }

    if (
        user.role === "staff" &&
        idOf(complaint.assignedTo) === String(user.userId)
    ) {
        return;
    }

    throw new AppError(
        "You do not have access to this complaint.",
        403
    );
};

// ------------------------------------------------------------------
// create
// ------------------------------------------------------------------

const createComplaint = async ({ collegeId, studentId, body }) => {
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category = body.category;
    const severity = body.severity || "medium";

    if (!title || !description || !category) {
        throw new AppError(
            "Title, description and category are required.",
            400
        );
    }

    if (title.length > 150) {
        throw new AppError(
            "Title cannot be longer than 150 characters.",
            400
        );
    }

    if (description.length > 5000) {
        throw new AppError(
            "Description cannot be longer than 5000 characters.",
            400
        );
    }

    if (!CATEGORIES.includes(category)) {
        throw new AppError("Invalid category.", 400);
    }

    if (!SEVERITIES.includes(severity)) {
        throw new AppError("Invalid severity.", 400);
    }

    const assignedTo = await assignComplaint({ collegeId, category });
    const now = new Date();

    const history = [
        {
            status: "submitted",
            changedBy: studentId,
            note: "Complaint submitted.",
            at: now
        }
    ];

    if (assignedTo) {
        history.push({
            status: "assigned",
            changedBy: null,
            note: "Automatically assigned to the department staff.",
            at: now
        });
    }

    const complaint = await Complaint.create({
        collegeId,
        studentId,
        title,
        description,
        category,
        severity,
        assignedTo,
        assignedAt: assignedTo ? now : null,
        status: assignedTo ? "assigned" : "submitted",
        statusHistory: history
    });

    // Staff notification (or admins if nobody could be auto-assigned).
    if (assignedTo) {
        await notify({
            collegeId,
            recipientId: assignedTo,
            complaintId: complaint._id,
            type: "complaint_assigned",
            title: "New complaint assigned to you",
            message: `${complaint.title} (${complaint.severity} priority)`
        });
    } else {
        await notifyCollegeAdmins({
            collegeId,
            complaintId: complaint._id,
            type: "complaint_unassigned",
            title: "Complaint needs assignment",
            message: `"${complaint.title}" could not be auto-assigned. Please assign it to a staff member.`
        });
    }

    return complaint.populate(LIST_POPULATE);
};

// ------------------------------------------------------------------
// read
// ------------------------------------------------------------------

const listMine = async ({ collegeId, studentId, query }) => {
    const filter = applyFilters({ collegeId, studentId }, query);
    return paginate(filter, query);
};

const listAssigned = async ({ collegeId, user, query }) => {
    const filter = { collegeId };

    if (user.role === "staff") {
        filter.assignedTo = new mongoose.Types.ObjectId(user.userId);
    } else if (query.assignedTo === "unassigned") {
        filter.assignedTo = null;
    } else if (query.assignedTo) {
        assertId(query.assignedTo, "staff ID");
        filter.assignedTo = new mongoose.Types.ObjectId(
            query.assignedTo
        );
    }

    applyFilters(filter, query);
    return paginate(filter, query);
};

const getComplaint = async ({ id, collegeId, user }) => {
    assertId(id, "complaint ID");

    const complaint = await Complaint.findOne({
        _id: id,
        collegeId
    }).populate(DETAIL_POPULATE);

    if (!complaint) {
        throw new AppError("Complaint not found.", 404);
    }

    assertCanView(complaint, user);
    return complaint;
};

const getProofFile = async ({ id, collegeId, user }) => {
    assertId(id, "complaint ID");

    const complaint = await Complaint.findOne({
        _id: id,
        collegeId
    }).select("studentId assignedTo proof status");

    if (!complaint) {
        throw new AppError("Complaint not found.", 404);
    }

    assertCanView(complaint, user);

    if (!complaint.proof?.storageKey) {
        throw new AppError("No proof image for this complaint.", 404);
    }

    return complaint.proof;
};

const getStats = async ({ collegeId, user }) => {
    const match = { collegeId };

    if (user.role === "student") {
        match.studentId = new mongoose.Types.ObjectId(user.userId);
    } else if (user.role === "staff") {
        match.assignedTo = new mongoose.Types.ObjectId(user.userId);
    }

    const rows = await Complaint.aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const stats = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    let total = 0;

    for (const row of rows) {
        stats[row._id] = row.count;
        total += row.count;
    }

    return { ...stats, total };
};

const getAnalytics = async ({ collegeId, days = 14 }) => {
    const span = Math.min(Math.max(days, 7), 90);

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (span - 1));

    const dayKey = (field) => ({
        $dateToString: { format: "%Y-%m-%d", date: field }
    });

    const [
        byCategory,
        bySeverity,
        created,
        resolved,
        resolution,
        topStaff
    ] = await Promise.all([
        Complaint.aggregate([
            { $match: { collegeId } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),
        Complaint.aggregate([
            { $match: { collegeId } },
            { $group: { _id: "$severity", count: { $sum: 1 } } }
        ]),
        Complaint.aggregate([
            { $match: { collegeId, createdAt: { $gte: since } } },
            { $group: { _id: dayKey("$createdAt"), count: { $sum: 1 } } }
        ]),
        Complaint.aggregate([
            {
                $match: {
                    collegeId,
                    status: "resolved",
                    resolvedAt: { $gte: since }
                }
            },
            { $group: { _id: dayKey("$resolvedAt"), count: { $sum: 1 } } }
        ]),
        Complaint.aggregate([
            {
                $match: {
                    collegeId,
                    status: "resolved",
                    resolvedAt: { $ne: null }
                }
            },
            {
                $group: {
                    _id: null,
                    avgMs: {
                        $avg: { $subtract: ["$resolvedAt", "$createdAt"] }
                    }
                }
            }
        ]),
        Complaint.aggregate([
            {
                $match: {
                    collegeId,
                    status: "resolved",
                    resolvedBy: { $ne: null }
                }
            },
            { $group: { _id: "$resolvedBy", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $project: {
                    count: 1,
                    name: { $arrayElemAt: ["$user.name", 0] },
                    department: { $arrayElemAt: ["$user.department", 0] }
                }
            }
        ])
    ]);

    const createdMap = new Map(created.map((r) => [r._id, r.count]));
    const resolvedMap = new Map(resolved.map((r) => [r._id, r.count]));

    const trend = [];

    for (let i = 0; i < span; i += 1) {
        const date = new Date(since);
        date.setUTCDate(since.getUTCDate() + i);
        const key = date.toISOString().slice(0, 10);

        trend.push({
            date: key,
            created: createdMap.get(key) ?? 0,
            resolved: resolvedMap.get(key) ?? 0
        });
    }

    return {
        byCategory: byCategory.map((r) => ({
            category: r._id,
            count: r.count
        })),
        bySeverity: bySeverity.map((r) => ({
            severity: r._id,
            count: r.count
        })),
        trend,
        avgResolutionHours: resolution[0]
            ? Math.round((resolution[0].avgMs / 36e5) * 10) / 10
            : null,
        topStaff: topStaff.map((r) => ({
            name: r.name || "Unknown",
            department: r.department || null,
            resolved: r.count
        }))
    };
};

// ------------------------------------------------------------------
// staff / admin: in-progress + resolve
// ------------------------------------------------------------------

const ALLOWED_FROM = {
    in_progress: ["assigned", "reopened"],
    resolved: ["assigned", "in_progress", "reopened"]
};

const updateStatus = async ({
    id,
    collegeId,
    user,
    status,
    remarks,
    file
}) => {
    assertId(id, "complaint ID");

    if (!ALLOWED_FROM[status]) {
        throw new AppError(
            "Status must be either in_progress or resolved.",
            400
        );
    }

    const note = String(remarks ?? "").trim();

    if (note.length > 2000) {
        throw new AppError(
            "Remarks cannot be longer than 2000 characters.",
            400
        );
    }

    if (status === "resolved" && !note) {
        throw new AppError(
            "Resolution remarks are required to mark a complaint as resolved.",
            400
        );
    }

    const complaint = await Complaint.findOne({
        _id: id,
        collegeId
    });

    if (!complaint) {
        throw new AppError("Complaint not found.", 404);
    }

    if (
        user.role === "staff" &&
        idOf(complaint.assignedTo) !== String(user.userId)
    ) {
        throw new AppError(
            "This complaint is not assigned to you.",
            403
        );
    }

    if (!complaint.assignedTo) {
        throw new AppError(
            "Assign this complaint to a staff member first.",
            409
        );
    }

    if (!ALLOWED_FROM[status].includes(complaint.status)) {
        throw new AppError(
            `A complaint that is "${complaint.status}" cannot be moved to "${status}".`,
            409
        );
    }

    // Image proof is optional; only accepted when resolving.
    let proof = null;

    if (status === "resolved" && file) {
        proof = await saveProofImage({
            collegeId,
            buffer: file.buffer,
            originalName: file.originalname
        });
    }

    const now = new Date();
    const set = { status };

    if (status === "resolved") {
        set.resolutionRemarks = note;
        set.proof = proof;
        set.resolvedAt = now;
        set.resolvedBy = user.userId;
    }

    let updated;

    try {
        // The status condition makes this atomic: two people cannot
        // both resolve the same complaint.
        updated = await Complaint.findOneAndUpdate(
            {
                _id: complaint._id,
                collegeId,
                status: complaint.status
            },
            {
                $set: set,
                $push: {
                    statusHistory: {
                        status,
                        changedBy: user.userId,
                        note,
                        at: now
                    }
                }
            },
            { new: true }
        ).populate(DETAIL_POPULATE);
    } catch (error) {
        await deleteStoredFile(proof?.storageKey);
        throw error;
    }

    if (!updated) {
        await deleteStoredFile(proof?.storageKey);
        throw new AppError(
            "This complaint was just updated by someone else. Please refresh.",
            409
        );
    }

    // Remove the proof belonging to a previous (reopened) resolution.
    if (status === "resolved" && complaint.proof?.storageKey) {
        await deleteStoredFile(complaint.proof.storageKey);
    }

    // Tell the student.
    if (status === "resolved") {
        await notify({
            collegeId,
            recipientId: complaint.studentId,
            complaintId: complaint._id,
            type: "complaint_resolved",
            title: "Your complaint has been resolved",
            message: `"${complaint.title}" has been resolved.${
                proof ? " A proof image is attached." : ""
            } Open it to see the resolution details.`
        });
    } else {
        await notify({
            collegeId,
            recipientId: complaint.studentId,
            complaintId: complaint._id,
            type: "status_updated",
            title: "Work has started on your complaint",
            message: `"${complaint.title}" is now in progress.`
        });
    }

    return updated;
};

// ------------------------------------------------------------------
// admin: assign / reassign
// ------------------------------------------------------------------

const assign = async ({ id, collegeId, admin, staffId }) => {
    assertId(id, "complaint ID");
    assertId(staffId, "staff ID");

    const [complaint, staff] = await Promise.all([
        Complaint.findOne({ _id: id, collegeId }),
        User.findOne({
            _id: staffId,
            collegeId,
            role: "staff",
            isActive: true
        }).select("name department")
    ]);

    if (!complaint) {
        throw new AppError("Complaint not found.", 404);
    }

    if (!staff) {
        throw new AppError(
            "Selected staff member was not found or is inactive.",
            404
        );
    }

    if (complaint.status === "resolved") {
        throw new AppError(
            "A resolved complaint cannot be reassigned.",
            409
        );
    }

    if (idOf(complaint.assignedTo) === String(staff._id)) {
        throw new AppError(
            "This complaint is already assigned to that staff member.",
            409
        );
    }

    const previousAssignee = complaint.assignedTo;
    const now = new Date();
    const newStatus =
        complaint.status === "submitted"
            ? "assigned"
            : complaint.status;

    const updated = await Complaint.findOneAndUpdate(
        {
            _id: complaint._id,
            collegeId,
            status: complaint.status
        },
        {
            $set: {
                assignedTo: staff._id,
                assignedAt: now,
                status: newStatus
            },
            $push: {
                statusHistory: {
                    status: newStatus,
                    changedBy: admin.userId,
                    note: `Assigned to ${staff.name}.`,
                    at: now
                }
            }
        },
        { new: true }
    ).populate(DETAIL_POPULATE);

    if (!updated) {
        throw new AppError(
            "This complaint was just updated by someone else. Please refresh.",
            409
        );
    }

    await notify({
        collegeId,
        recipientId: staff._id,
        complaintId: complaint._id,
        type: "complaint_assigned",
        title: "New complaint assigned to you",
        message: `${complaint.title} (${complaint.severity} priority)`
    });

    if (previousAssignee) {
        await notify({
            collegeId,
            recipientId: previousAssignee,
            complaintId: complaint._id,
            type: "complaint_reassigned",
            title: "Complaint reassigned",
            message: `"${complaint.title}" has been reassigned to another staff member.`
        });
    }

    await notify({
        collegeId,
        recipientId: complaint.studentId,
        complaintId: complaint._id,
        type: "status_updated",
        title: "Your complaint has been assigned",
        message: `"${complaint.title}" is now assigned to ${staff.name}.`
    });

    return updated;
};

// ------------------------------------------------------------------
// student: reopen
// ------------------------------------------------------------------

const reopen = async ({ id, collegeId, studentId, reason }) => {
    assertId(id, "complaint ID");

    const note = String(reason ?? "").trim();

    if (note.length < 5) {
        throw new AppError(
            "Please explain why the issue is not resolved (at least 5 characters).",
            400
        );
    }

    if (note.length > 1000) {
        throw new AppError(
            "Reason cannot be longer than 1000 characters.",
            400
        );
    }

    const complaint = await Complaint.findOne({
        _id: id,
        collegeId,
        studentId
    });

    if (!complaint) {
        throw new AppError("Complaint not found.", 404);
    }

    if (complaint.status !== "resolved") {
        throw new AppError(
            "Only resolved complaints can be reopened.",
            409
        );
    }

    if (complaint.reopenCount >= MAX_REOPENS) {
        throw new AppError(
            `A complaint can be reopened at most ${MAX_REOPENS} times. Please contact the administrator.`,
            409
        );
    }

    const now = new Date();

    const updated = await Complaint.findOneAndUpdate(
        {
            _id: complaint._id,
            collegeId,
            studentId,
            status: "resolved"
        },
        {
            $set: { status: "reopened", resolvedAt: null },
            $inc: { reopenCount: 1 },
            $push: {
                statusHistory: {
                    status: "reopened",
                    changedBy: studentId,
                    note,
                    at: now
                }
            }
        },
        { new: true }
    ).populate(DETAIL_POPULATE);

    if (!updated) {
        throw new AppError(
            "This complaint was just updated. Please refresh.",
            409
        );
    }

    const payload = {
        collegeId,
        complaintId: complaint._id,
        type: "complaint_reopened",
        title: "Complaint reopened by student",
        message: `"${complaint.title}" was reopened: ${note.slice(0, 150)}`
    };

    if (complaint.assignedTo) {
        await notify({ ...payload, recipientId: complaint.assignedTo });
    } else {
        await notifyCollegeAdmins(payload);
    }

    return updated;
};

export {
    createComplaint,
    listMine,
    listAssigned,
    getComplaint,
    getProofFile,
    getStats,
    getAnalytics,
    updateStatus,
    assign,
    reopen
};
