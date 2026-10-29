import College from "../models/College.js";
import User from "../models/User.js";
import Document from "../models/Document.js";
import AppError from "../utils/AppError.js";
import { PLANS } from "../constants/plans.js";

const DAY = 24 * 60 * 60 * 1000;

const trialDaysLeft = (college) => {
    if (college.plan?.tier !== "trial" || !college.plan.trialEndsAt) {
        return null;
    }

    return Math.max(
        Math.ceil((college.plan.trialEndsAt.getTime() - Date.now()) / DAY),
        0
    );
};

const isPlanExpired = (college) => trialDaysLeft(college) === 0;

const countFor = (collegeId, resource) => {
    if (resource === "students") {
        return User.countDocuments({ collegeId, role: "student" });
    }
    if (resource === "staff") {
        return User.countDocuments({ collegeId, role: "staff" });
    }
    return Document.countDocuments({ collegeId, isActive: true });
};

const getUsage = async (collegeId) => {
    const college = await College.findById(collegeId);

    if (!college) throw new AppError("College not found.", 404);

    const tier = college.plan?.tier || "trial";
    const plan = PLANS[tier];

    const [students, staff, documents] = await Promise.all([
        countFor(collegeId, "students"),
        countFor(collegeId, "staff"),
        countFor(collegeId, "documents")
    ]);

    return {
        tier,
        label: plan.label,
        price: plan.price,
        trialDaysLeft: trialDaysLeft(college),
        expired: isPlanExpired(college),
        limits: plan.limits,
        usage: { students, staff, documents }
    };
};

// Throws a 402 when adding `count` more of `resource` would exceed the plan.
const assertCapacity = async (collegeId, resource, count = 1) => {
    const college = await College.findById(collegeId);

    if (!college) throw new AppError("College not found.", 404);

    if (isPlanExpired(college)) {
        throw new AppError(
            "Your free trial has ended. Upgrade your plan to continue adding people or documents.",
            402
        );
    }

    const limit = PLANS[college.plan?.tier || "trial"].limits[resource];
    const current = await countFor(collegeId, resource);

    if (current + count > limit) {
        throw new AppError(
            `Your plan allows up to ${limit} ${resource}. Upgrade to add more.`,
            402
        );
    }
};

export { getUsage, assertCapacity, trialDaysLeft, isPlanExpired };
