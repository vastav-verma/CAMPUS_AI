import "../src/config/env.js";

import bcrypt from "bcryptjs";

import connectDB from "../src/config/database.js";

import College from "../src/models/College.js";
import User from "../src/models/User.js";


const createAdmin = async () => {

    try {

        await connectDB();


        // ==========================================
        // Find College A
        // ==========================================

        const college = await College.findOne({
            collegeCode: "COLLEGE_A",
            isActive: true
        });


        if (!college) {

            throw new Error(
                "College A not found."
            );
        }


        // ==========================================
        // Admin details
        // ==========================================

        const name = "College A Admin";

        const email =
            "admin@collegea.edu";

        const password =
            "Admin@123";


        // ==========================================
        // Check existing admin
        // ==========================================

        const existingUser =
            await User.findOne({
                email
            });


        if (existingUser) {

            console.log(
                "Admin already exists:"
            );

            console.log(existingUser);

            process.exit(0);
        }


        // ==========================================
        // Hash password
        // ==========================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );


        // ==========================================
        // Create admin
        // ==========================================

        const admin =
            await User.create({

                name,

                email,

                password:
                    hashedPassword,

                collegeId:
                    college._id,

                role:
                    "college_admin",

                isActive:
                    true
            });


        console.log(
            "College Admin created successfully:"
        );

        console.log({

            id:
                admin._id,

            name:
                admin.name,

            email:
                admin.email,

            collegeId:
                admin.collegeId,

            role:
                admin.role
        });


        console.log(
            "\nLogin credentials:"
        );

        console.log(
            "Email:",
            email
        );

        console.log(
            "Password:",
            password
        );


        process.exit(0);


    } catch (error) {

        console.error(
            "Failed to create admin:",
            error.message
        );

        process.exit(1);
    }
};


createAdmin();