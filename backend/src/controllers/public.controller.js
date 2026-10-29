import bcrypt from "bcryptjs";

import College from "../models/College.js";
import User from "../models/User.js";
import Invite from "../models/Invite.js";
import AppError from "../utils/AppError.js";
import { authResponse } from "../utils/authResponse.js";
import { PLANS } from "../constants/plans.js";
import { CATEGORIES } from "../constants/complaint.constants.js";
import { assertCapacity } from "../services/plan.service.js";

import {
    CODE_PATTERN,
    assertEmail,
    assertPassword,
    slugifyCode
} from "../utils/validators.js";

const DAY = 24 * 60 * 60 * 1000;

const codeTaken = async (code) =>
    Boolean(await College.exists({ collegeCode: code }));

// Finds a free code based on the college name.
const suggestCode = async (name) => {
    const base = slugifyCode(name) || "COLLEGE";

    if (!(await codeTaken(base))) return base;

    for (let i = 0; i < 20; i += 1) {
        const candidate = `${base.slice(0, 16)}_${Math.floor(
            Math.random() * 900 + 100
        )}`;

        if (!(await codeTaken(candidate))) return candidate;
    }

    throw new AppError("Could not generate a college code. Please choose one.", 409);
};

const publicCollege = (college) => ({
    name: college.name,
    collegeCode: college.collegeCode,
    chatbotName: college.settings?.chatbotName,
    primaryColor: college.branding?.primaryColor,
    openRegistration: Boolean(college.settings?.openRegistration)
});

// ---------------------------------------------------------------
// Self-serve signup: creates a college on a free trial + its admin
// ---------------------------------------------------------------
const signup = async (req, res) => {
    const body = req.body ?? {};

    const collegeName = String(body.collegeName ?? "").trim();
    const adminName = String(body.adminName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!collegeName || !adminName || !email || !password) {
        throw new AppError(
            "College name, your name, email and password are required.",
            400
        );
    }

    if (collegeName.length > 120 || adminName.length > 100) {
        throw new AppError("Name is too long.", 400);
    }

    assertEmail(email);
    assertPassword(password);

    let collegeCode = String(body.collegeCode ?? "").trim().toUpperCase();

    if (collegeCode) {
        if (!CODE_PATTERN.test(collegeCode)) {
            throw new AppError(
                "College code must be 2-20 characters: letters, numbers or underscore.",
                400
            );
        }
        if (await codeTaken(collegeCode)) {
            throw new AppError("This college code is already taken.", 409);
        }
    } else {
        collegeCode = await suggestCode(collegeName);
    }

    let college;

    try {
        college = await College.create({
            name: collegeName,
            collegeCode,
            plan: {
                tier: "trial",
                trialEndsAt: new Date(
                    Date.now() + PLANS.trial.trialDays * DAY
                )
            },
            settings: {
                chatbotName: `${collegeName} Assistant`,
                welcomeMessage: "Ask me anything about the college."
            }
        });
    } catch (error) {
        if (error?.code === 11000) {
            throw new AppError("This college code is already taken.", 409);
        }
        throw error;
    }

    try {
        const admin = await User.create({
            name: adminName,
            email,
            password: await bcrypt.hash(password, 12),
            collegeId: college._id,
            role: "college_admin"
        });

        res.status(201).json({
            success: true,
            message: "Your college workspace is ready.",
            data: {
                ...authResponse(admin),
                college: publicCollege(college)
            }
        });
    } catch (error) {
        await College.deleteOne({ _id: college._id });
        throw error;
    }
};

const checkCode = async (req, res) => {
    const code = String(req.params.code ?? "").toUpperCase();

    if (!CODE_PATTERN.test(code)) {
        return res.json({
            success: true,
            data: { available: false, reason: "Use 2-20 letters, numbers or _" }
        });
    }

    res.json({
        success: true,
        data: { available: !(await codeTaken(code)) }
    });
};

const suggestCodeEndpoint = async (req, res) => {
    const name = String(req.query.name ?? "").trim();

    res.json({
        success: true,
        data: { code: name ? await suggestCode(name) : "" }
    });
};

// Branding for login / join pages
const getCollegeBranding = async (req, res) => {
    const college = await College.findOne({
        collegeCode: String(req.params.code ?? "").toUpperCase(),
        isActive: true,
        isPlatform: { $ne: true }
    });

    if (!college) throw new AppError("College not found.", 404);

    res.json({ success: true, data: publicCollege(college) });
};

// ---------------------------------------------------------------
// Invite links
// ---------------------------------------------------------------
const loadValidInvite = async (token) => {
    const invite = await Invite.findOne({ token: String(token) });

    if (
        !invite ||
        !invite.isActive ||
        invite.expiresAt < new Date() ||
        invite.uses >= invite.maxUses
    ) {
        throw new AppError(
            "This invite link is invalid, expired or has reached its limit.",
            404
        );
    }

    const college = await College.findOne({
        _id: invite.collegeId,
        isActive: true
    });

    if (!college) throw new AppError("This college is not available.", 404);

    return { invite, college };
};

const getInvite = async (req, res) => {
    const { invite, college } = await loadValidInvite(req.params.token);

    res.json({
        success: true,
        data: {
            role: invite.role,
            department: invite.department,
            college: publicCollege(college)
        }
    });
};

const acceptInvite = async (req, res) => {
    const { invite, college } = await loadValidInvite(req.params.token);
    const body = req.body ?? {};

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!name || !email || !password) {
        throw new AppError("Name, email and password are required.", 400);
    }

    assertEmail(email);
    assertPassword(password);

    await assertCapacity(
        college._id,
        invite.role === "staff" ? "staff" : "students"
    );

    if (invite.role === "staff" && !CATEGORIES.includes(invite.department)) {
        throw new AppError("This invite has an invalid department.", 400);
    }

    // Reserve a use first so two people cannot exceed maxUses together.
    const reserved = await Invite.findOneAndUpdate(
        {
            _id: invite._id,
            isActive: true,
            $expr: { $lt: ["$uses", "$maxUses"] }
        },
        { $inc: { uses: 1 } }
    );

    if (!reserved) {
        throw new AppError("This invite link has reached its limit.", 409);
    }

    try {
        const user = await User.create({
            name,
            email,
            password: await bcrypt.hash(password, 12),
            collegeId: college._id,
            role: invite.role,
            department: invite.role === "staff" ? invite.department : null
        });

        res.status(201).json({
            success: true,
            message: "Welcome aboard!",
            data: authResponse(user)
        });
    } catch (error) {
        await Invite.updateOne({ _id: invite._id }, { $inc: { uses: -1 } });

        if (error?.code === 11000) {
            throw new AppError(
                "An account with this email already exists. Please sign in instead.",
                409
            );
        }

        throw error;
    }
};

export {
    signup,
    checkCode,
    suggestCodeEndpoint,
    getCollegeBranding,
    getInvite,
    acceptInvite
};
