import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false
        },

        collegeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: true,
            index: true
        },

        department: {
            type: String,
            trim: true,
            default: null
        },
        role: {
            type: String,
            enum: [
                "student",
                "college_admin",
                "staff",
                "super_admin"
            ],
            default: "student"
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

userSchema.index(
    { collegeId: 1, email: 1 },
    { unique: true }
);

const User = mongoose.model("User", userSchema);

export default User;