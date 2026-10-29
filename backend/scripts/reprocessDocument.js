import "dotenv/config";
import mongoose from "mongoose";

import Document from "../src/models/Document.js";
import DocumentChunk from "../src/models/DocumentChunk.js";

import chunkMarkdown
    from "../src/services/documentProcessor/markdownChunker.js";

import {
    generateEmbedding
} from "../src/services/embedding.service.js";


// ==========================================
// CONFIG
// ==========================================

const DOCUMENT_ID =
    process.env.REPROCESS_DOCUMENT_ID;


// ==========================================
// MAIN
// ==========================================

const reprocessDocument = async () => {

    if (!DOCUMENT_ID) {

        throw new Error(
            "REPROCESS_DOCUMENT_ID is required in .env"
        );
    }


    // ==========================================
    // DATABASE
    // ==========================================

    await mongoose.connect(
        process.env.MONGO_URI
    );

    console.log(
        "MongoDB connected."
    );


    // ==========================================
    // FIND DOCUMENT
    // ==========================================

    const document =
        await Document.findById(
            DOCUMENT_ID
        );


    if (!document) {

        throw new Error(
            "Document not found."
        );
    }


    if (!document.markdownText) {

        throw new Error(
            "Document does not contain Markdown content."
        );
    }


    console.log(
        `Reprocessing: ${document.title}`
    );


    // ==========================================
    // DELETE OLD CHUNKS
    // ==========================================

    const deleted =
        await DocumentChunk.deleteMany({

            documentId:
                document._id,

            collegeId:
                document.collegeId
        });


    console.log(
        `Deleted old chunks: ${deleted.deletedCount}`
    );


    try {

        // ==========================================
        // UPDATE STATUS
        // ==========================================

        document.processingStatus =
            "chunking";

        document.processingError =
            null;

        await document.save();


        // ==========================================
        // MARKDOWN → NEW RECURSIVE CHUNKS
        // ==========================================

        const chunks =
            chunkMarkdown(
                document.markdownText
            );


        if (!chunks.length) {

            throw new Error(
                "No chunks generated."
            );
        }


        console.log(
            `New chunks generated: ${chunks.length}`
        );


        // ==========================================
        // EMBEDDINGS
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

                collegeId:
                    document.collegeId,

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
                        document.fileName
                }
            });
        }


        // ==========================================
        // SAVE NEW CHUNKS
        // ==========================================

        await DocumentChunk.insertMany(
            chunkDocuments
        );


        // ==========================================
        // READY
        // ==========================================

        document.processingStatus =
            "ready";

        document.processingError =
            null;

        await document.save();


        console.log(
            "\n===================================="
        );

        console.log(
            "DOCUMENT REPROCESSED SUCCESSFULLY"
        );

        console.log(
            `Total chunks: ${chunkDocuments.length}`
        );

        console.log(
            "====================================\n"
        );


    } catch (error) {

        console.error(
            "Reprocessing failed:",
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
// RUN
// ==========================================

reprocessDocument()

    .catch(error => {

        console.error(
            error.message
        );

    })

    .finally(async () => {

        await mongoose.disconnect();

        console.log(
            "MongoDB disconnected."
        );

    });