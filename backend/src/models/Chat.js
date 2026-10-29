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
        timestamps: true
    }
);


const chatSchema = new mongoose.Schema(
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
        // USER
        // ==========================================

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },


        // ==========================================
        // CHAT TITLE
        // ==========================================

        title: {
            type: String,
            required: true,
            trim: true,
            default: "New Chat"
        },


        // ==========================================
        // MESSAGES
        // ==========================================

        messages: {
            type: [messageSchema],
            default: []
        },


        // ==========================================
        // STATUS
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

chatSchema.index({
    collegeId: 1,
    userId: 1,
    updatedAt: -1
});


const Chat =
    mongoose.model(
        "Chat",
        chatSchema
    );


export default Chat;