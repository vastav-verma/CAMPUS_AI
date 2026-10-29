import "../src/config/env.js";
import connectDB from "../src/config/database.js";
import College from "../src/models/College.js";

const createCollegeB = async () => {
    try {

        await connectDB();

        const existingCollege = await College.findOne({
            collegeCode: "COLLEGE_B"
        });

        if (existingCollege) {
            console.log("College B already exists:");
            console.log(existingCollege);
            process.exit(0);
        }

        const college = await College.create({
            name: "College B",
            collegeCode: "COLLEGE_B",
            emailDomain: "collegeb.edu",
            logo: null,
            isActive: true,

            settings: {
                chatbotName: "College B Assistant",
                welcomeMessage: "How can I help you today?"
            }
        });

        console.log(
            "College B created successfully:"
        );

        console.log(college);

        process.exit(0);

    } catch (error) {

        console.error(
            "Failed to create College B:",
            error.message
        );

        process.exit(1);
    }
};

createCollegeB();