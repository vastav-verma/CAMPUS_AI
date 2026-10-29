import dotenv from "dotenv";

dotenv.config();

const requiredEnvVariables = [
    "MONGO_URI",
    "JWT_SECRET"
];

for (const variable of requiredEnvVariables) {
    if (!process.env[variable]) {
        throw new Error(`Missing environment variable: ${variable}`);
    }
}