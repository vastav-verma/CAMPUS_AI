import crypto from "node:crypto";

import Invite from "../models/Invite.js";
import AppError from "../utils/AppError.js";
import { CATEGORIES } from "../constants/complaint.constants.js";
import { isId } from "../utils/validators.js";

const DAY = 24 * 60 * 60 * 1000;

const createInvite = async (req, res) => {
    const body = req.body ?? {};
    const role = body.role;

    if (!["student", "staff"].includes(role)) {
        throw new AppError("Role must be student or staff.", 400);
    }

    let department = null;

    if (role === "staff") {
        if (!CATEGORIES.includes(body.department)) {
            throw new AppError("Choose a department for staff invites.", 400);
        }
        department = body.department;
    }

    const maxUses = Math.min(Math.max(parseInt(body.maxUses, 10) || 100, 1), 5000);
    const days = Math.min(Math.max(parseInt(body.expiresInDays, 10) || 14, 1), 90);

    const invite = await Invite.create({
        collegeId: req.tenant.collegeId,
        token: crypto.randomBytes(18).toString("base64url"),
        role,
        department,
        maxUses,
        expiresAt: new Date(Date.now() + days * DAY),
        createdBy: req.user.userId
    });

    res.status(201).json({ success: true, data: invite });
};

const listInvites = async (req, res) => {
    const invites = await Invite.find({ collegeId: req.tenant.collegeId })
        .sort({ createdAt: -1 })
        .limit(50);

    res.json({ success: true, data: invites });
};

const revokeInvite = async (req, res) => {
    if (!isId(req.params.id)) throw new AppError("Invalid invite ID.", 400);

    const invite = await Invite.findOneAndUpdate(
        { _id: req.params.id, collegeId: req.tenant.collegeId },
        { $set: { isActive: false } },
        { new: true }
    );

    if (!invite) throw new AppError("Invite not found.", 404);

    res.json({ success: true, data: invite });
};

export { createInvite, listInvites, revokeInvite };
