import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { assertCapacity } from "../services/plan.service.js";
import { CATEGORIES } from "../constants/complaint.constants.js";
import { EMAIL_PATTERN, isId } from "../utils/validators.js";

const MAX_IMPORT_ROWS = 100;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const tempPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const bytes = crypto.randomBytes(10);
    return `${Array.from(bytes, (b) => chars[b % chars.length]).join("")}7a`;
};

// Students / staff of the college (admin only)
const listUsers = async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

    const filter = {
        collegeId: req.tenant.collegeId,
        role: ["student", "staff"].includes(req.query.role)
            ? req.query.role
            : { $in: ["student", "staff"] }
    };

    const q = String(req.query.q ?? "").trim().slice(0, 100);

    if (q) {
        const rx = { $regex: escapeRegex(q), $options: "i" };
        filter.$or = [{ name: rx }, { email: rx }];
    }

    const [items, total] = await Promise.all([
        User.find(filter)
            .select("name email role department isActive createdAt")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        User.countDocuments(filter)
    ]);

    res.json({
        success: true,
        data: items,
        pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) }
    });
};

const setUserActive = async (req, res) => {
    if (!isId(req.params.id)) throw new AppError("Invalid user ID.", 400);

    if (typeof req.body?.isActive !== "boolean") {
        throw new AppError("isActive must be true or false.", 400);
    }

    const user = await User.findOneAndUpdate(
        {
            _id: req.params.id,
            collegeId: req.tenant.collegeId,
            role: { $in: ["student", "staff"] }
        },
        { $set: { isActive: req.body.isActive } },
        { new: true }
    ).select("name email role isActive");

    if (!user) throw new AppError("User not found.", 404);

    res.json({ success: true, data: user });
};

// Bulk import from a CSV the admin uploaded in the browser.
// rows: [{ name, email, role?, department? }]
const importUsers = async (req, res) => {
    const rows = req.body?.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
        throw new AppError("No rows to import.", 400);
    }

    if (rows.length > MAX_IMPORT_ROWS) {
        throw new AppError(
            `You can import at most ${MAX_IMPORT_ROWS} people at a time.`,
            400
        );
    }

    const collegeId = req.tenant.collegeId;
    const skipped = [];
    const valid = [];
    const seen = new Set();

    rows.forEach((row, index) => {
        const line = index + 2; // +1 header, +1 human numbering
        const name = String(row?.name ?? "").trim();
        const email = String(row?.email ?? "").trim().toLowerCase();
        const role = String(row?.role || "student").trim().toLowerCase();
        const department = String(row?.department ?? "").trim() || null;

        if (!name || !EMAIL_PATTERN.test(email)) {
            return skipped.push({ line, email, reason: "Missing name or invalid email" });
        }
        if (!["student", "staff"].includes(role)) {
            return skipped.push({ line, email, reason: "Role must be student or staff" });
        }
        if (role === "staff" && !CATEGORIES.includes(department)) {
            return skipped.push({ line, email, reason: "Staff need a valid department" });
        }
        if (seen.has(email)) {
            return skipped.push({ line, email, reason: "Duplicate email in file" });
        }

        seen.add(email);
        valid.push({ name, email, role, department: role === "staff" ? department : null });
    });

    const existing = await User.find({
        collegeId,
        email: { $in: valid.map((v) => v.email) }
    }).select("email");

    const existingSet = new Set(existing.map((u) => u.email));
    const toCreate = valid.filter((v) => {
        if (existingSet.has(v.email)) {
            skipped.push({ line: null, email: v.email, reason: "Already registered" });
            return false;
        }
        return true;
    });

    const students = toCreate.filter((v) => v.role === "student").length;
    const staff = toCreate.length - students;

    if (students) await assertCapacity(collegeId, "students", students);
    if (staff) await assertCapacity(collegeId, "staff", staff);

    const created = [];

    for (const person of toCreate) {
        const password = tempPassword();

        await User.create({
            ...person,
            collegeId,
            password: await bcrypt.hash(password, 10)
        });

        created.push({
            name: person.name,
            email: person.email,
            role: person.role,
            department: person.department,
            password
        });
    }

    res.status(201).json({
        success: true,
        message: `${created.length} account(s) created.`,
        data: { created, skipped }
    });
};

export { listUsers, setUserActive, importUsers };
