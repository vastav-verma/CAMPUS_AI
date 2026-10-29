import multer from "multer";

import AppError from "../utils/AppError.js";


// Store uploaded files temporarily in memory.
// We will later use cloud/object storage for production.
const storage = multer.memoryStorage();


const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "application/pdf",
        "text/plain",
        "text/markdown"
    ];


    if (allowedTypes.includes(file.mimetype)) {

        cb(null, true);

    } else {

        cb(
            new AppError(
                "Only PDF, TXT and Markdown files are allowed.",
                400
            ),
            false
        );
    }
};


const upload = multer({
    storage,

    fileFilter,

    limits: {
        // Maximum file size = 10 MB
        fileSize: 10 * 1024 * 1024
    }
});


// ==========================================
// Complaint resolution proof (optional image)
// ==========================================

const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];

const proofUpload = multer({
    storage,

    fileFilter: (req, file, cb) => {
        if (PROOF_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new AppError(
                    "Proof must be a JPG, PNG or WEBP image.",
                    400
                ),
                false
            );
        }
    },

    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
        files: 1
    }
});

// Field name: "proof". Also parses the other multipart text fields.
export const uploadProofImage = proofUpload.single("proof");

export default upload;