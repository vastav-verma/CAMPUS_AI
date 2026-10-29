import Document from "../models/Document.js";
import DocumentChunk from "../models/DocumentChunk.js";

import pdfToMarkdown
    from "./documentProcessor/pdfToMarkdown.js";

import cleanMarkdown
    from "./documentProcessor/markdownCleaner.js";

import chunkMarkdown
    from "./documentProcessor/markdownChunker.js";

import {
    generateEmbedding
} from "./embedding.service.js";


// ==========================================
// CREATE / UPLOAD DOCUMENT
// ==========================================

const createDocument = async ({
    file,
    title,
    collegeId,
    userId
}) => {

    if (!file) {

        throw new Error(
            "Document file is required."
        );
    }


    if (!title) {

        throw new Error(
            "Document title is required."
        );
    }


    // ==========================================
    // CREATE DOCUMENT RECORD
    // ==========================================

    const document =
        await Document.create({

            collegeId,

            title,

            fileName:
                file.originalname,

            fileType:
                file.mimetype ===
                "application/pdf"
                    ? "pdf"
                    : "other",

            sourceType:
                "uploaded_file",

            processingStatus:
                "converting",

            uploadedBy:
                userId
        });


    try {

        // ==========================================
        // PDF → MARKDOWN
        // ==========================================

        let markdown =
            await pdfToMarkdown(
                file.buffer
            );


        // ==========================================
        // CLEAN MARKDOWN
        // ==========================================

        markdown =
            cleanMarkdown(
                markdown
            );


        if (!markdown) {

            throw new Error(
                "Generated Markdown is empty."
            );
        }


        document.markdownText =
            markdown;

        document.processingStatus =
            "chunking";

        await document.save();


        // ==========================================
        // MARKDOWN → CHUNKS
        // ==========================================

        const chunks =
            chunkMarkdown(
                markdown
            );


        if (!chunks.length) {

            throw new Error(
                "No chunks generated."
            );
        }


        // ==========================================
        // GENERATE EMBEDDINGS
        // ==========================================

        document.processingStatus =
            "embedding";

        await document.save();


        const chunkDocuments = [];


        for (
            let index = 0;
            index < chunks.length;
            index++
        ) {

            const chunk =
                chunks[index];


            console.log(
                `Generating embedding ${index + 1}/${chunks.length}`
            );


            const embedding =
                await generateEmbedding(
                    chunk.content
                );


            chunkDocuments.push({

                collegeId,

                documentId:
                    document._id,

                chunkIndex:
                    index,

                content:
                    chunk.content,

                embedding,

                metadata: {

                    section:
                        chunk.section,

                    source:
                        file.originalname
                }
            });
        }


        // ==========================================
        // SAVE CHUNKS
        // ==========================================

        await DocumentChunk.insertMany(
            chunkDocuments
        );


        // ==========================================
        // MARK DOCUMENT READY
        // ==========================================

        document.processingStatus =
            "ready";

        document.processingError =
            null;

        await document.save();


        return {

            document,

            totalChunks:
                chunkDocuments.length
        };


    } catch (error) {

        console.error(
            "Document processing failed:",
            error
        );


        document.processingStatus =
            "failed";

        document.processingError =
            error.message;


        await document.save();


        throw error;
    }
};


// ==========================================
// GET ALL DOCUMENTS
// ==========================================

const getDocuments = async (
    collegeId
) => {

    const documents =
        await Document.find({

            collegeId,

            isActive: true

        })
        .select(
            "title description fileName fileType sourceType processingStatus processingError uploadedBy createdAt updatedAt"
        )
        .populate(
            "uploadedBy",
            "name email"
        )
        .sort({
            createdAt: -1
        });


    return documents;
};


// ==========================================
// GET SINGLE DOCUMENT
// ==========================================

const getDocumentById = async ({
    documentId,
    collegeId
}) => {

    const document =
        await Document.findOne({

            _id:
                documentId,

            collegeId,

            isActive: true

        })
        .populate(
            "uploadedBy",
            "name email"
        );


    if (!document) {

        throw new Error(
            "Document not found."
        );
    }


    return document;
};


// ==========================================
// DELETE DOCUMENT
// ==========================================

const deleteDocument = async ({
    documentId,
    collegeId
}) => {

    const document =
        await Document.findOne({

            _id:
                documentId,

            collegeId,

            isActive: true
        });


    if (!document) {

        throw new Error(
            "Document not found."
        );
    }


    // ==========================================
    // DELETE ASSOCIATED CHUNKS
    // ==========================================

    await DocumentChunk.deleteMany({

        documentId,

        collegeId
    });


    // ==========================================
    // SOFT DELETE DOCUMENT
    // ==========================================

    document.isActive =
        false;

    await document.save();


    return true;
};


export {
    createDocument,
    getDocuments,
    getDocumentById,
    deleteDocument
};