import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        collegeCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        emailDomain: {
            type: String,
            trim: true,
            lowercase: true
        },

        logo: {
            type: String,
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        },

        // The internal tenant that owns super admin accounts.
        isPlatform: {
            type: Boolean,
            default: false
        },

        settings: {
            chatbotName: {
                type: String,
                default: "Campus Assistant"
            },

            welcomeMessage: {
                type: String,
                default: "How can I help you?"
            }
        }
    },
    {
        timestamps: true
    }
);

const College = mongoose.model("College", collegeSchema);

export default College;