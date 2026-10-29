import { assertCapacity } from "../services/plan.service.js";

import {
    createDocument,
    getDocuments,
    getDocumentById,
    deleteDocument
} from "../services/document.service.js";


// ==========================================
// UPLOAD DOCUMENT
// ==========================================

const uploadDocument = async (req, res) => {

    try {

        const { title } = req.body;


        if (!title) {

            return res.status(400).json({

                success: false,

                message:
                    "Document title is required."
            });
        }


        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "Document file is required."
            });
        }


        await assertCapacity(req.tenant.collegeId, "documents");

        const result =
            await createDocument({

                file:
                    req.file,

                title,

                collegeId:
                    req.tenant.collegeId,

                userId:
                    req.user.userId
            });


        return res.status(201).json({

            success: true,

            message:
                "Document uploaded and processed successfully.",

            data:
                result
        });


    } catch (error) {

        console.error(
            "Document upload error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message
        });
    }
};


// ==========================================
// GET ALL DOCUMENTS
// ==========================================

const getAllDocuments = async (req, res) => {

    try {

        const documents =
            await getDocuments(
                req.tenant.collegeId
            );


        return res.status(200).json({

            success: true,

            data:
                documents
        });


    } catch (error) {

        console.error(
            "Get documents error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message
        });
    }
};


// ==========================================
// GET SINGLE DOCUMENT
// ==========================================

const getSingleDocument = async (req, res) => {

    try {

        const document =
            await getDocumentById({

                documentId:
                    req.params.id,

                collegeId:
                    req.tenant.collegeId
            });


        return res.status(200).json({

            success: true,

            data:
                document
        });


    } catch (error) {

        console.error(
            "Get document error:",
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
// DELETE DOCUMENT
// ==========================================

const removeDocument = async (req, res) => {

    try {

        await deleteDocument({

            documentId:
                req.params.id,

            collegeId:
                req.tenant.collegeId
        });


        return res.status(200).json({

            success: true,

            message:
                "Document deleted successfully."
        });


    } catch (error) {

        console.error(
            "Delete document error:",
            error
        );


        return res.status(404).json({

            success: false,

            message:
                error.message
        });
    }
};


export {
    uploadDocument,
    getAllDocuments,
    getSingleDocument,
    removeDocument
};