import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import AppError from "../utils/AppError.js";
import { assertCapacity } from "../services/plan.service.js";

import {
    CATEGORIES,
    OPEN_STATUSES
} from "../constants/complaint.constants.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicStaff = (user, openComplaints = 0) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    department: user.department,
    isActive: user.isActive,
    createdAt: user.createdAt,
    openComplaints
});

const listStaff = async (req, res) => {
    const collegeId = req.tenant.collegeId;
    const filter = { collegeId, role: "staff" };

    if (req.query.department) {
        if (!CATEGORIES.includes(req.query.department)) {
            throw new AppError("Invalid department.", 400);
        }
        filter.department = req.query.department;
    }

    if (req.query.active === "true") {
        filter.isActive = true;
    }

    const staff = await User.find(filter)
        .select("name email department isActive createdAt")
        .sort({ name: 1 })
        .lean();

    const loads = await Complaint.aggregate([
        {
            $match: {
                collegeId,
                assignedTo: { $in: staff.map((s) => s._id) },
                status: { $in: OPEN_STATUSES }
            }
        },
        { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
    ]);

    const loadMap = new Map(
        loads.map((row) => [String(row._id), row.count])
    );

    res.json({
        success: true,
        data: staff.map((member) =>
            publicStaff(member, loadMap.get(String(member._id)) ?? 0)
        )
    });
};

const createStaff = async (req, res) => {
    const body = req.body ?? {};

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const department = body.department;

    if (!name || !email || !password || !department) {
        throw new AppError(
            "Name, email, password and department are required.",
            400
        );
    }

    if (name.length > 100) {
        throw new AppError("Name is too long.", 400);
    }

    if (!EMAIL_PATTERN.test(email)) {
        throw new AppError("Enter a valid email address.", 400);
    }

    if (
        password.length < 8 ||
        !/[A-Za-z]/.test(password) ||
        !/\d/.test(password)
    ) {
        throw new AppError(
            "Password must be at least 8 characters and contain a letter and a number.",
            400
        );
    }

    if (!CATEGORIES.includes(department)) {
        throw new AppError("Invalid department.", 400);
    }

    await assertCapacity(req.tenant.collegeId, "staff");

    try {
        const user = await User.create({
            name,
            email,
            password: await bcrypt.hash(password, 12),
            collegeId: req.tenant.collegeId,
            department,
            role: "staff"
        });

        res.status(201).json({
            success: true,
            data: publicStaff(user),
            message: "Staff member created."
        });
    } catch (error) {
        if (error?.code === 11000) {
            throw new AppError(
                "A user with this email already exists in your college.",
                409
            );
        }

        throw error;
    }
};

const setStaffActive = async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
        throw new AppError("Invalid staff ID.", 400);
    }

    if (typeof req.body?.isActive !== "boolean") {
        throw new AppError("isActive must be true or false.", 400);
    }

    const user = await User.findOneAndUpdate(
        {
            _id: req.params.id,
            collegeId: req.tenant.collegeId,
            role: "staff"
        },
        { $set: { isActive: req.body.isActive } },
        { new: true }
    );

    if (!user) {
        throw new AppError("Staff member not found.", 404);
    }

    res.json({ success: true, data: publicStaff(user) });
};

export { listStaff, createStaff, setStaffActive };
