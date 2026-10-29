import mongoose from "mongoose";


const documentChunkSchema = new mongoose.Schema(
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
        // SOURCE DOCUMENT
        // ==========================================

        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            required: true,
            index: true
        },


        // ==========================================
        // CHUNK POSITION
        // ==========================================

        chunkIndex: {
            type: Number,
            required: true
        },


        // ==========================================
        // CHUNK CONTENT
        // ==========================================

        content: {
            type: String,
            required: true,
            trim: true
        },


        // ==========================================
        // VECTOR EMBEDDING
        // ==========================================

        embedding: {
            type: [Number],
            default: undefined
        },


        // ==========================================
        // METADATA
        // ==========================================

        metadata: {

            pageNumber: {
                type: Number,
                default: null
            },

            section: {
                type: String,
                default: null
            },

            source: {
                type: String,
                default: null
            }
        },


        // ==========================================
        // EMBEDDING STATUS / ID
        // ==========================================

        embeddingId: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);


// ==========================================
// PREVENT DUPLICATE CHUNKS
// ==========================================

documentChunkSchema.index(
    {
        documentId: 1,
        chunkIndex: 1
    },
    {
        unique: true
    }
);


// ==========================================
// TENANT + DOCUMENT INDEX
// ==========================================

documentChunkSchema.index({
    collegeId: 1,
    documentId: 1
});


const DocumentChunk =
    mongoose.model(
        "DocumentChunk",
        documentChunkSchema
    );


export default DocumentChunk;