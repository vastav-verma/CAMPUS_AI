import Chat from "../models/Chat.js";


// ==========================================
// CREATE NEW CHAT
// ==========================================

const createChat = async ({
    collegeId,
    userId,
    title = "New Chat"
}) => {

    if (!collegeId) {
        throw new Error(
            "College ID is required."
        );
    }

    if (!userId) {
        throw new Error(
            "User ID is required."
        );
    }


    const chat = await Chat.create({

        collegeId,

        userId,

        title,

        messages: [],

        isActive: true
    });


    return chat;
};


// ==========================================
// GET USER CHATS
// ==========================================

const getUserChats = async ({
    collegeId,
    userId
}) => {

    if (!collegeId) {
        throw new Error(
            "College ID is required."
        );
    }

    if (!userId) {
        throw new Error(
            "User ID is required."
        );
    }


    const chats =
        await Chat.find({

            collegeId,

            userId,

            isActive: true

        })
        .select(
            "_id title createdAt updatedAt"
        )
        .sort({
            updatedAt: -1
        });


    return chats;
};


// ==========================================
// GET SINGLE CHAT
// ==========================================

const getChatById = async ({
    chatId,
    collegeId,
    userId
}) => {

    if (!chatId) {
        throw new Error(
            "Chat ID is required."
        );
    }


    const chat =
        await Chat.findOne({

            _id:
                chatId,

            collegeId,

            userId,

            isActive: true
        });


    if (!chat) {

        throw new Error(
            "Chat not found."
        );
    }


    return chat;
};


// ==========================================
// ADD MESSAGE
// ==========================================

const addMessage = async ({
    chatId,
    collegeId,
    userId,
    role,
    content
}) => {

    if (!chatId) {
        throw new Error(
            "Chat ID is required."
        );
    }

    if (!role) {
        throw new Error(
            "Message role is required."
        );
    }

    if (!content || !content.trim()) {
        throw new Error(
            "Message content is required."
        );
    }


    const chat =
        await Chat.findOne({

            _id:
                chatId,

            collegeId,

            userId,

            isActive: true
        });


    if (!chat) {

        throw new Error(
            "Chat not found."
        );
    }


    chat.messages.push({

        role,

        content:
            content.trim()
    });


    await chat.save();


    return chat;
};


// ==========================================
// DELETE CHAT
// ==========================================

const deleteChat = async ({
    chatId,
    collegeId,
    userId
}) => {

    const chat =
        await Chat.findOne({

            _id:
                chatId,

            collegeId,

            userId,

            isActive: true
        });


    if (!chat) {

        throw new Error(
            "Chat not found."
        );
    }


    // Soft delete
    chat.isActive = false;

    await chat.save();


    return true;
};


// ==========================================
// EXPORT
// ==========================================

export {
    createChat,
    getUserChats,
    getChatById,
    addMessage,
    deleteChat
};