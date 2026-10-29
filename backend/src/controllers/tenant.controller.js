import College from "../models/College.js";
import AppError from "../utils/AppError.js";
import { getUsage } from "../services/plan.service.js";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const shape = (college) => ({
    _id: college._id,
    name: college.name,
    collegeCode: college.collegeCode,
    chatbotName: college.settings?.chatbotName,
    welcomeMessage: college.settings?.welcomeMessage,
    primaryColor: college.branding?.primaryColor,
    openRegistration: Boolean(college.settings?.openRegistration),
    supportEmail: college.settings?.supportEmail || "",
    plan: college.plan?.tier || "trial"
});

// Any signed-in user: branding + chatbot settings of their college
const getMyCollege = async (req, res) => {
    const college = await College.findById(req.tenant.collegeId);
    if (!college) throw new AppError("College not found.", 404);

    res.json({ success: true, data: shape(college) });
};

const updateSettings = async (req, res) => {
    const body = req.body ?? {};
    const set = {};

    if (body.name !== undefined) {
        const name = String(body.name).trim();
        if (!name || name.length > 120) throw new AppError("Enter a valid college name.", 400);
        set.name = name;
    }

    if (body.chatbotName !== undefined) {
        const value = String(body.chatbotName).trim();
        if (!value || value.length > 60) throw new AppError("Assistant name must be 1-60 characters.", 400);
        set["settings.chatbotName"] = value;
    }

    if (body.welcomeMessage !== undefined) {
        const value = String(body.welcomeMessage).trim();
        if (value.length > 200) throw new AppError("Welcome message is too long.", 400);
        set["settings.welcomeMessage"] = value;
    }

    if (body.supportEmail !== undefined) {
        set["settings.supportEmail"] = String(body.supportEmail).trim().slice(0, 120);
    }

    if (body.openRegistration !== undefined) {
        set["settings.openRegistration"] = Boolean(body.openRegistration);
    }

    if (body.primaryColor !== undefined) {
        if (!HEX_COLOR.test(body.primaryColor)) {
            throw new AppError("Brand colour must be a hex value like #4f46e5.", 400);
        }
        set["branding.primaryColor"] = body.primaryColor;
    }

    if (Object.keys(set).length === 0) throw new AppError("Nothing to update.", 400);

    const college = await College.findByIdAndUpdate(
        req.tenant.collegeId,
        { $set: set },
        { new: true }
    );

    res.json({ success: true, data: shape(college) });
};

const getBilling = async (req, res) => {
    res.json({ success: true, data: await getUsage(req.tenant.collegeId) });
};

export { getMyCollege, updateSettings, getBilling };
