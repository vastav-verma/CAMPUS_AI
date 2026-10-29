import Conversation from "../models/Conversation.js";


// ==========================================
// CREATE CONVERSATION
// ==========================================

const createConversation = async ({
    userId,
    collegeId,
    title = "New Conversation"
}) => {

    if (!userId || !collegeId) {
        throw new Error(
            "User ID and College ID are required."
        );
    }


    const conversation =
        await Conversation.create({

            userId,

            collegeId,

            title,

            messages: []
        });


    return conversation;
};


// ==========================================
// GET USER CONVERSATIONS
// ==========================================

const getUserConversations = async ({
    userId,
    collegeId
}) => {

    const conversations =
        await Conversation.find({

            userId,

            collegeId,

            isActive: true

        })
        .sort({
            updatedAt: -1
        })
        .select(
            "_id title createdAt updatedAt"
        );


    return conversations;
};


// ==========================================
// GET SINGLE CONVERSATION
// ==========================================

const getConversation = async ({
    conversationId,
    userId,
    collegeId
}) => {

    const conversation =
        await Conversation.findOne({

            _id:
                conversationId,

            userId,

            collegeId,

            isActive: true
        });


    if (!conversation) {

        throw new Error(
            "Conversation not found."
        );
    }


    return conversation;
};


// ==========================================
// ADD MESSAGE
// ==========================================

const addMessage = async ({
    conversationId,
    userId,
    collegeId,
    role,
    content
}) => {

    if (
        !conversationId ||
        !userId ||
        !collegeId ||
        !role ||
        !content
    ) {

        throw new Error(
            "Conversation details are required."
        );
    }


    const conversation =
        await Conversation.findOne({

            _id:
                conversationId,

            userId,

            collegeId,

            isActive: true
        });


    if (!conversation) {

        throw new Error(
            "Conversation not found."
        );
    }


    conversation.messages.push({

        role,

        content
    });


    await conversation.save();


    return conversation;
};


// ==========================================
// DELETE CONVERSATION
// ==========================================

const deleteConversation = async ({
    conversationId,
    userId,
    collegeId
}) => {

    const conversation =
        await Conversation.findOne({

            _id:
                conversationId,

            userId,

            collegeId,

            isActive: true
        });


    if (!conversation) {

        throw new Error(
            "Conversation not found."
        );
    }


    conversation.isActive = false;

    await conversation.save();


    return true;
};


export {
    createConversation,
    getUserConversations,
    getConversation,
    addMessage,
    deleteConversation
};