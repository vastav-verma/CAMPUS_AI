import "../src/config/env.js";
import connectDB from "../src/config/database.js";

import bcrypt from "bcryptjs";

import User from "../src/models/User.js";
import College from "../src/models/College.js";


const createAdminB = async () => {

    try {

        await connectDB();


        // ==========================================
        // FIND COLLEGE B
        // ==========================================

        const college = await College.findOne({
            collegeCode: "COLLEGE_B",
            isActive: true
        });


        if (!college) {

            throw new Error(
                "College B not found."
            );
        }


        // ==========================================
        // CHECK EXISTING ADMIN
        // ==========================================

        const existingAdmin = await User.findOne({
            email: "admin@collegeb.edu",
            collegeId: college._id
        });


        if (existingAdmin) {

            console.log(
                "College B Admin already exists:"
            );

            console.log({
                id: existingAdmin._id,
                name: existingAdmin.name,
                email: existingAdmin.email,
                collegeId: existingAdmin.collegeId,
                role: existingAdmin.role
            });

            process.exit(0);
        }


        // ==========================================
        // HASH PASSWORD
        // ==========================================

        const hashedPassword =
            await bcrypt.hash(
                "Admin@123",
                12
            );


        // ==========================================
        // CREATE ADMIN
        // ==========================================

        const admin = await User.create({

            name: "College B Admin",

            email: "admin@collegeb.edu",

            password: hashedPassword,

            collegeId: college._id,

            role: "college_admin",

            isActive: true
        });


        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            "College B Admin created successfully:"
        );

        console.log({

            id: admin._id,

            name: admin.name,

            email: admin.email,

            collegeId: admin.collegeId,

            role: admin.role

        });


        console.log(
            "\nLogin credentials:"
        );

        console.log(
            "Email: admin@collegeb.edu"
        );

        console.log(
            "Password: Admin@123"
        );


        process.exit(0);

    } catch (error) {

        console.error(
            "Failed to create College B Admin:",
            error.message
        );

        process.exit(1);
    }
};


createAdminB();