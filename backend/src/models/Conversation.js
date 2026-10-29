import mongoose from "mongoose";


const messageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: [
                "user",
                "assistant"
            ],
            required: true
        },

        content: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true,
        _id: true
    }
);


const conversationSchema = new mongoose.Schema(
    {
        // ==========================================
        // TENANT
        // ==========================================

        collegeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: true,
            index: true
        },


        // ==========================================
        // STUDENT / USER
        // ==========================================

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },


        // ==========================================
        // CONVERSATION TITLE
        // ==========================================

        title: {
            type: String,
            trim: true,
            default: "New Conversation"
        },


        // ==========================================
        // MESSAGES
        // ==========================================

        messages: {
            type: [messageSchema],
            default: []
        },


        // ==========================================
        // ACTIVE STATUS
        // ==========================================

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);


// ==========================================
// TENANT + USER INDEX
// ==========================================

conversationSchema.index({
    collegeId: 1,
    userId: 1,
    updatedAt: -1
});


const Conversation =
    mongoose.model(
        "Conversation",
        conversationSchema
    );


export default Conversation;