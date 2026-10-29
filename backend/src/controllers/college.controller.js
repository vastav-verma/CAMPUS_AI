import bcrypt from "bcryptjs";

import College from "../models/College.js";
import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import AppError from "../utils/AppError.js";
import { PLANS, PLAN_TIERS } from "../constants/plans.js";
import { trialDaysLeft } from "../services/plan.service.js";

const CODE_PATTERN = /^[A-Z0-9_]{2,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_PATTERN = /^[a-z0-9.-]+\.[a-z]{2,}$/;

const isId = (v) => /^[a-f\d]{24}$/i.test(String(v));

const listColleges = async (req, res) => {
    const colleges = await College.find({ isPlatform: { $ne: true } })
        .sort({ createdAt: -1 })
        .lean();

    const ids = colleges.map((c) => c._id);

    const [userRows, complaintRows] = await Promise.all([
        User.aggregate([
            { $match: { collegeId: { $in: ids } } },
            {
                $group: {
                    _id: { collegeId: "$collegeId", role: "$role" },
                    count: { $sum: 1 }
                }
            }
        ]),
        Complaint.aggregate([
            { $match: { collegeId: { $in: ids } } },
            { $group: { _id: "$collegeId", count: { $sum: 1 } } }
        ])
    ]);

    const counts = new Map(
        ids.map((id) => [
            String(id),
            { students: 0, staff: 0, admins: 0, complaints: 0 }
        ])
    );

    const roleKey = {
        student: "students",
        staff: "staff",
        college_admin: "admins"
    };

    for (const row of userRows) {
        const key = roleKey[row._id.role];
        if (key) counts.get(String(row._id.collegeId))[key] = row.count;
    }

    for (const row of complaintRows) {
        counts.get(String(row._id)).complaints = row.count;
    }

    res.json({
        success: true,
        data: colleges.map((college) => ({
            _id: college._id,
            name: college.name,
            collegeCode: college.collegeCode,
            emailDomain: college.emailDomain || "",
            plan: college.plan?.tier || "trial",
            trialDaysLeft: trialDaysLeft(college),
            isActive: college.isActive,
            createdAt: college.createdAt,
            stats: counts.get(String(college._id))
        }))
    });
};

// Creates a college together with its first college_admin account.
const createCollege = async (req, res) => {
    const body = req.body ?? {};
    const adminBody = body.admin ?? {};

    const name = String(body.name ?? "").trim();
    const collegeCode = String(body.collegeCode ?? "")
        .trim()
        .toUpperCase();
    const emailDomain = String(body.emailDomain ?? "")
        .trim()
        .toLowerCase();

    const adminName = String(adminBody.name ?? "").trim();
    const adminEmail = String(adminBody.email ?? "")
        .trim()
        .toLowerCase();
    const adminPassword = String(adminBody.password ?? "");

    if (!name || !collegeCode || !adminName || !adminEmail || !adminPassword) {
        throw new AppError(
            "College name, college code and the admin's name, email and password are required.",
            400
        );
    }

    if (name.length > 120) {
        throw new AppError("College name is too long.", 400);
    }

    if (!CODE_PATTERN.test(collegeCode)) {
        throw new AppError(
            "College code must be 2-20 characters: letters, numbers or underscore.",
            400
        );
    }

    if (emailDomain && !DOMAIN_PATTERN.test(emailDomain)) {
        throw new AppError(
            "Enter a valid email domain, e.g. college.edu.",
            400
        );
    }

    if (!EMAIL_PATTERN.test(adminEmail)) {
        throw new AppError("Enter a valid admin email address.", 400);
    }

    if (
        adminPassword.length < 8 ||
        !/[A-Za-z]/.test(adminPassword) ||
        !/\d/.test(adminPassword)
    ) {
        throw new AppError(
            "Admin password must be at least 8 characters and contain a letter and a number.",
            400
        );
    }

    let college;

    try {
        college = await College.create({
            name,
            collegeCode,
            emailDomain: emailDomain || undefined,
            plan: {
                tier: "trial",
                trialEndsAt: new Date(
                    Date.now() + PLANS.trial.trialDays * 24 * 60 * 60 * 1000
                )
            },
            settings: {
                chatbotName: `${name} Assistant`,
                welcomeMessage: "How can I help you today?"
            }
        });
    } catch (error) {
        if (error?.code === 11000) {
            throw new AppError(
                "A college with this code already exists.",
                409
            );
        }
        throw error;
    }

    try {
        const admin = await User.create({
            name: adminName,
            email: adminEmail,
            password: await bcrypt.hash(adminPassword, 12),
            collegeId: college._id,
            role: "college_admin"
        });

        res.status(201).json({
            success: true,
            message: "College created. Share the admin credentials securely.",
            data: {
                college: {
                    _id: college._id,
                    name: college.name,
                    collegeCode: college.collegeCode
                },
                admin: { _id: admin._id, email: admin.email }
            }
        });
    } catch (error) {
        // Roll back so we never leave a college without an admin.
        await College.deleteOne({ _id: college._id });
        throw error;
    }
};

const setCollegeActive = async (req, res) => {
    if (!isId(req.params.id)) {
        throw new AppError("Invalid college ID.", 400);
    }

    if (typeof req.body?.isActive !== "boolean") {
        throw new AppError("isActive must be true or false.", 400);
    }

    const college = await College.findOneAndUpdate(
        { _id: req.params.id, isPlatform: { $ne: true } },
        { $set: { isActive: req.body.isActive } },
        { new: true }
    );

    if (!college) {
        throw new AppError("College not found.", 404);
    }

    res.json({
        success: true,
        data: { _id: college._id, isActive: college.isActive }
    });
};

const setCollegePlan = async (req, res) => {
    if (!isId(req.params.id)) throw new AppError("Invalid college ID.", 400);

    const tier = req.body?.tier;

    if (!PLAN_TIERS.includes(tier)) {
        throw new AppError("Invalid plan.", 400);
    }

    const set = { "plan.tier": tier };

    if (tier === "trial") {
        set["plan.trialEndsAt"] = new Date(
            Date.now() + PLANS.trial.trialDays * 24 * 60 * 60 * 1000
        );
    }

    const college = await College.findOneAndUpdate(
        { _id: req.params.id, isPlatform: { $ne: true } },
        { $set: set },
        { new: true }
    );

    if (!college) throw new AppError("College not found.", 404);

    res.json({ success: true, data: { _id: college._id, plan: college.plan.tier } });
};

export { listColleges, createCollege, setCollegeActive, setCollegePlan };
