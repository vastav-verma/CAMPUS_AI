import express from "express";

import {
    createConversation,
    getUserConversations,
    getConversation,
    deleteConversation
} from "../services/conversation.service.js";

import protect
    from "../middleware/auth.middleware.js";

import attachTenant
    from "../middleware/tenant.middleware.js";


const router =
    express.Router();


// ==========================================
// CREATE CONVERSATION
// ==========================================

router.post(

    "/",

    protect,

    attachTenant,

    async (req, res) => {

        try {

            const conversation =
                await createConversation({

                    userId:
                        req.user.userId,

                    collegeId:
                        req.tenant.collegeId,

                    title:
                        req.body.title ||
                        "New Conversation"
                });


            return res.status(201).json({

                success: true,

                data:
                    conversation
            });


        } catch (error) {

            console.error(
                "Create conversation error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error.message
            });
        }
    }
);


// ==========================================
// GET USER CONVERSATIONS
// ==========================================

router.get(

    "/",

    protect,

    attachTenant,

    async (req, res) => {

        try {

            const conversations =
                await getUserConversations({

                    userId:
                        req.user.userId,

                    collegeId:
                        req.tenant.collegeId
                });


            return res.status(200).json({

                success: true,

                data:
                    conversations
            });


        } catch (error) {

            console.error(
                "Get conversations error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error.message
            });
        }
    }
);


// ==========================================
// GET SINGLE CONVERSATION
// ==========================================

router.get(

    "/:id",

    protect,

    attachTenant,

    async (req, res) => {

        try {

            const conversation =
                await getConversation({

                    conversationId:
                        req.params.id,

                    userId:
                        req.user.userId,

                    collegeId:
                        req.tenant.collegeId
                });


            return res.status(200).json({

                success: true,

                data:
                    conversation
            });


        } catch (error) {

            console.error(
                "Get conversation error:",
                error
            );


            return res.status(404).json({

                success: false,

                message:
                    error.message
            });
        }
    }
);


// ==========================================
// DELETE CONVERSATION
// ==========================================

router.delete(

    "/:id",

    protect,

    attachTenant,

    async (req, res) => {

        try {

            await deleteConversation({

                conversationId:
                    req.params.id,

                userId:
                    req.user.userId,

                collegeId:
                    req.tenant.collegeId
            });


            return res.status(200).json({

                success: true,

                message:
                    "Conversation deleted successfully."
            });


        } catch (error) {

            console.error(
                "Delete conversation error:",
                error
            );


            return res.status(404).json({

                success: false,

                message:
                    error.message
            });
        }
    }
);


export default router;