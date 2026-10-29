// Usage: node scripts/createStaff.js <collegeCode> <department> <email> <password> "<Full Name>"
// Example: node scripts/createStaff.js COLLEGE_A hostel warden@collegea.edu Warden@123 "Hostel Warden"
import "../src/config/env.js";

import bcrypt from "bcryptjs";

import connectDB from "../src/config/database.js";
import College from "../src/models/College.js";
import User from "../src/models/User.js";
import { CATEGORIES } from "../src/constants/complaint.constants.js";

const [collegeCode, department, email, password, name] =
    process.argv.slice(2);

const run = async () => {
    if (!collegeCode || !department || !email || !password || !name) {
        throw new Error(
            'Usage: node scripts/createStaff.js <collegeCode> <department> <email> <password> "<Full Name>"'
        );
    }

    if (!CATEGORIES.includes(department)) {
        throw new Error(`Department must be one of: ${CATEGORIES.join(", ")}`);
    }

    await connectDB();

    const college = await College.findOne({
        collegeCode: collegeCode.toUpperCase(),
        isActive: true
    });

    if (!college) throw new Error("College not found.");

    const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: await bcrypt.hash(password, 12),
        collegeId: college._id,
        department,
        role: "staff"
    });

    console.log("Staff created:", {
        id: user._id,
        email: user.email,
        department: user.department
    });

    process.exit(0);
};

run().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
