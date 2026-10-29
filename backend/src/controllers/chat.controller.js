import {
    retrieveRelevantChunks
} from "../services/rag/retrieval.service.js";

import buildContext
    from "../services/rag/context.service.js";

import generateAnswer
    from "../services/rag/answer.service.js";

import {
    createChat,
    getChatById,
    addMessage,
    getUserChats,
    deleteChat
} from "../services/chat.service.js";


// ==========================================
// CHAT
// ==========================================

const chat = async (req, res) => {

    try {

        const {
            question,
            chatId
        } = req.body;


        // ==========================================
        // VALIDATION
        // ==========================================

        if (
            !question ||
            !question.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Question is required."
            });
        }


        // ==========================================
        // TENANT + USER
        // ==========================================

        const collegeId =
            req.tenant.collegeId;

        const userId =
            req.user.userId;


        // ==========================================
        // GET EXISTING CHAT / CREATE NEW CHAT
        // ==========================================

        let chatSession;


        if (chatId) {

            chatSession =
                await getChatById({

                    chatId,

                    collegeId,

                    userId
                });

        } else {

            chatSession =
                await createChat({

                    collegeId,

                    userId,

                    title:
                        question
                            .trim()
                            .slice(0, 60)
                });
        }


        // ==========================================
        // SAVE USER MESSAGE
        // ==========================================

        await addMessage({

            chatId:
                chatSession._id,

            collegeId,

            userId,

            role:
                "user",

            content:
                question.trim()
        });


        // ==========================================
        // DETECT BROAD QUESTION
        // ==========================================

        const broadQuestionPattern =
            /(what is|what are|tell me about|explain|describe|give me|provide|summarize|summary|all|complete|entire|details|detail|rules|policy|policies|procedure|process|eligibility|requirements|how does|how do)/i;


        const isBroadQuestion =
            broadQuestionPattern.test(
                question.trim()
            );


        // ==========================================
        // RETRIEVAL LIMIT
        // ==========================================

        const retrievalLimit =
            isBroadQuestion
                ? 8
                : 5;


        // ==========================================
        // RETRIEVE RELEVANT CHUNKS
        // ==========================================

        const chunks =
            await retrieveRelevantChunks({

                query:
                    question,

                collegeId,

                limit:
                    retrievalLimit
            });


        // ==========================================
        // NO RESULTS
        // ==========================================

        if (
            !chunks ||
            chunks.length === 0
        ) {

            const noResultAnswer =
                "I could not find relevant information in the college knowledge base.";


            // Save AI response
            await addMessage({

                chatId:
                    chatSession._id,

                collegeId,

                userId,

                role:
                    "assistant",

                content:
                    noResultAnswer
            });


            return res.status(200).json({

                success: true,

                data: {

                    chatId:
                        chatSession._id,

                    answer:
                        noResultAnswer,

                    sources: []
                }
            });
        }


        // ==========================================
        // BUILD CONTEXT
        // ==========================================

        const context =
            buildContext(chunks);


        // ==========================================
        // GENERATE ANSWER
        // ==========================================

        const aiResult =
            await generateAnswer({

                question,

                context
            });


        // ==========================================
        // SAVE AI MESSAGE
        // ==========================================

        await addMessage({

            chatId:
                chatSession._id,

            collegeId,

            userId,

            role:
                "assistant",

            content:
                aiResult
        });


        // ==========================================
        // SOURCES
        // ==========================================

        const sources =
            chunks.map((chunk) => ({

                documentId:
                    chunk.documentId,

                chunkIndex:
                    chunk.chunkIndex,

                score:
                    chunk.score,

                metadata:
                    chunk.metadata
            }));


        // ==========================================
        // FINAL RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            data: {

                chatId:
                    chatSession._id,

                answer:
                    aiResult,

                sources
            }
        });


    } catch (error) {

        // ==========================================
        // ERROR LOG
        // ==========================================

        console.error(
            "Chat error:",
            error
        );


        // ==========================================
        // ERROR RESPONSE
        // ==========================================

        return res.status(500).json({

            success: false,

            message:
                "Failed to generate answer."
        });
    }
};


// ==========================================
// GET USER CHAT HISTORY
// ==========================================

const getChats = async (req, res) => {

    try {

        const chats =
            await getUserChats({

                collegeId:
                    req.tenant.collegeId,

                userId:
                    req.user.userId
            });


        return res.status(200).json({

            success: true,

            data:
                chats
        });


    } catch (error) {

        console.error(
            "Get chats error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch chats."
        });
    }
};


// ==========================================
// GET SINGLE CHAT
// ==========================================

const getSingleChat = async (req, res) => {

    try {

        const chatSession =
            await getChatById({

                chatId:
                    req.params.id,

                collegeId:
                    req.tenant.collegeId,

                userId:
                    req.user.userId
            });


        return res.status(200).json({

            success: true,

            data:
                chatSession
        });


    } catch (error) {

        console.error(
            "Get single chat error:",
            error
        );


        return res.status(404).json({

            success: false,

            message:
                error.message
        });
    }
};


// ==========================================
// DELETE CHAT
// ==========================================

const removeChat = async (req, res) => {

    try {

        await deleteChat({

            chatId:
                req.params.id,

            collegeId:
                req.tenant.collegeId,

            userId:
                req.user.userId
        });


        return res.status(200).json({

            success: true,

            message:
                "Chat deleted successfully."
        });


    } catch (error) {

        console.error(
            "Delete chat error:",
            error
        );


        return res.status(404).json({

            success: false,

            message:
                error.message
        });
    }
};


// ==========================================
// EXPORT
// ==========================================

export {
    chat,
    getChats,
    getSingleChat,
    removeChat
};