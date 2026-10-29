// Creates the internal "PLATFORM" tenant and the first super admin.
// Usage: node scripts/createSuperAdmin.js <email> <password> ["Full Name"]
//
// The super admin logs in with college code PLATFORM and can then
// onboard new colleges from the web UI (/super-admin).
import "../src/config/env.js";

import bcrypt from "bcryptjs";

import connectDB from "../src/config/database.js";
import College from "../src/models/College.js";
import User from "../src/models/User.js";

const [email, password, name = "Platform Admin"] = process.argv.slice(2);

const run = async () => {
    if (!email || !password) {
        throw new Error(
            'Usage: node scripts/createSuperAdmin.js <email> <password> ["Full Name"]'
        );
    }

    if (
        password.length < 8 ||
        !/[A-Za-z]/.test(password) ||
        !/\d/.test(password)
    ) {
        throw new Error(
            "Password must be at least 8 characters with a letter and a number."
        );
    }

    await connectDB();

    const platform =
        (await College.findOne({ collegeCode: "PLATFORM" })) ||
        (await College.create({
            name: "Platform",
            collegeCode: "PLATFORM",
            isPlatform: true
        }));

    const exists = await User.findOne({
        collegeId: platform._id,
        email: email.toLowerCase()
    });

    if (exists) {
        console.log("Super admin already exists:", exists.email);
        process.exit(0);
    }

    const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: await bcrypt.hash(password, 12),
        collegeId: platform._id,
        role: "super_admin"
    });

    console.log("Super admin created.");
    console.log("Sign in with -> College code: PLATFORM | Email:", user.email);
    process.exit(0);
};

run().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
