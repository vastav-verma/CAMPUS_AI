import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
    {
        collegeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            required: true,
            index: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        fileName: {
            type: String,
            trim: true,
            default: null
        },

        fileType: {
            type: String,
            enum: [
                "pdf",
                "docx",
                "txt",
                "md",
                "html",
                "other"
            ],
            default: "other"
        },

        sourceType: {
            type: String,
            enum: [
                "uploaded_file",
                "website",
                "manual"
            ],
            default: "uploaded_file"
        },

        // Converted Markdown content
        markdownText: {
            type: String,
            default: null
        },

        // Document processing status
        processingStatus: {
            type: String,
            enum: [
                "pending",
                "converting",
                "chunking",
                "embedding",
                "ready",
                "failed"
            ],
            default: "pending"
        },

        // Stores processing error if something fails
        processingError: {
            type: String,
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);


// Useful for tenant-specific document queries
documentSchema.index({
    collegeId: 1,
    createdAt: -1
});


const Document = mongoose.model(
    "Document",
    documentSchema
);

export default Document;