import bcrypt from "bcryptjs";

import User from "../models/User.js";
import College from "../models/College.js";
import generateToken from "../utils/generateToken.js";
import { assertCapacity } from "./plan.service.js";

const registerUser = async ({
    name,
    email,
    password,
    collegeCode
}) => {

    const college = await College.findOne({
        collegeCode: collegeCode.toUpperCase(),
        isActive: true
    });

    if (!college || college.isPlatform) {
        throw new Error("Invalid college code.");
    }

    if (!college.settings?.openRegistration) {
        throw new Error(
            "Self-registration is turned off for this college. Please use the invite link from your administrator."
        );
    }

    await assertCapacity(college._id, "students");

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
        email: normalizedEmail,
        collegeId: college._id
    });

    if (existingUser) {
        throw new Error(
            "User already exists in this college."
        );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        collegeId: college._id,
        role: "student"
    });

    const token = generateToken(user);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            collegeId: user.collegeId,
            role: user.role,
            department: user.department
        }
    };
};


const loginUser = async ({
    email,
    password,
    collegeCode
}) => {

    const college = await College.findOne({
        collegeCode: collegeCode.toUpperCase(),
        isActive: true
    });

    if (!college) {
        throw new Error("Invalid credentials.");
    }

    const user = await User.findOne({
        email: email.toLowerCase().trim(),
        collegeId: college._id
    }).select("+password");

    if (!user) {
        throw new Error("Invalid credentials.");
    }

    const passwordMatched = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatched) {
        throw new Error("Invalid credentials.");
    }

    if (!user.isActive) {
        throw new Error("Your account has been disabled.");
    }

    const token = generateToken(user);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            collegeId: user.collegeId,
            role: user.role,
            department: user.department
        }
    };
};


const getCurrentUser = async (userId) => {

    const user = await User.findById(userId)
        .populate("collegeId", "name collegeCode");

    if (!user) {
        throw new Error("User not found.");
    }

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.collegeId,
        role: user.role,
        department: user.department
    };
};


const changePassword = async ({
    userId,
    currentPassword,
    newPassword
}) => {

    if (
        typeof newPassword !== "string" ||
        newPassword.length < 8 ||
        !/[A-Za-z]/.test(newPassword) ||
        !/\d/.test(newPassword)
    ) {
        throw new Error(
            "New password must be at least 8 characters and contain a letter and a number."
        );
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
        throw new Error("User not found.");
    }

    const matched = await bcrypt.compare(
        String(currentPassword ?? ""),
        user.password
    );

    if (!matched) {
        throw new Error("Current password is incorrect.");
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
};


export {
    changePassword,
    registerUser,
    loginUser,
    getCurrentUser
};