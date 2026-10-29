import api from "./api";


// ==========================================
// GET ALL CHATS
// ==========================================

const getChats = async () => {

    const response =
        await api.get("/chat");

    return response.data;
};


// ==========================================
// GET SINGLE CHAT
// ==========================================

const getChat = async (
    chatId
) => {

    const response =
        await api.get(
            `/chat/${chatId}`
        );

    return response.data;
};


// ==========================================
// SEND MESSAGE
// ==========================================

const sendMessage = async ({
    question,
    chatId = null
}) => {

    const response =
        await api.post(
            "/chat",
            {
                question,
                ...(chatId && { chatId })
            }
        );

    return response.data;
};


// ==========================================
// DELETE CHAT
// ==========================================

const deleteChat = async (
    chatId
) => {

    const response =
        await api.delete(
            `/chat/${chatId}`
        );

    return response.data;
};


export {
    getChats,
    getChat,
    sendMessage,
    deleteChat
};