import mongoose from "mongoose";

// A shareable join link. One link can onboard many people until it
// expires, is revoked, or reaches maxUses.
const inviteSchema = new mongoose.Schema(
    {
        collegeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: true,
            index: true
        },

        token: {
            type: String,
            required: true,
            unique: true
        },

        role: {
            type: String,
            enum: ["student", "staff"],
            required: true
        },

        // Required for staff invites (complaint category they handle)
        department: {
            type: String,
            default: null
        },

        maxUses: {
            type: Number,
            default: 100,
            min: 1,
            max: 5000
        },

        uses: {
            type: Number,
            default: 0
        },

        expiresAt: {
            type: Date,
            required: true
        },

        isActive: {
            type: Boolean,
            default: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

export default mongoose.model("Invite", inviteSchema);
