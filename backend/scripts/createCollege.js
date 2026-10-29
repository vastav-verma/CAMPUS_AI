import "../src/config/env.js";

import connectDB from "../src/config/database.js";
import College from "../src/models/College.js";

const createCollege = async () => {
    try {
        await connectDB();

        const college = await College.create({
            name: "College B",
            collegeCode: "COLLEGE_B",
            emailDomain: "collegeb.edu",
            settings: {
                chatbotName: "College B Assistant",
                welcomeMessage: "How can I help you today?"
            }
        });

        console.log("College created successfully:");
        console.log(college);

        process.exit(0);

    } catch (error) {
        console.error("Failed to create college:", error.message);
        process.exit(1);
    }
};

createCollege();