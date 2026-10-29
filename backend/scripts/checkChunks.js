import dotenv from "dotenv";

dotenv.config();

import mongoose from "mongoose";

import Document from "../src/models/Document.js";
import DocumentChunk from "../src/models/DocumentChunk.js";


// ==========================================
// CHECK DATABASE + DOCUMENT CHUNKS
// ==========================================

const checkChunks = async () => {

    try {

        // ==========================================
        // CONNECT DATABASE
        // ==========================================

        const connection =
            await mongoose.connect(
                process.env.MONGO_URI
            );


        console.log(
            "\n========== DATABASE =========="
        );

        console.log(
            "Database:",
            connection.connection.name
        );

        console.log(
            "Host:",
            connection.connection.host
        );

        console.log(
            "Document collection:",
            Document.collection.name
        );

        console.log(
            "Chunk collection:",
            DocumentChunk.collection.name
        );


        // ==========================================
        // COUNTS
        // ==========================================

        const documentCount =
            await Document.countDocuments();

        const chunkCount =
            await DocumentChunk.countDocuments();


        console.log(
            "\n========== COUNTS =========="
        );

        console.log(
            "Documents:",
            documentCount
        );

        console.log(
            "DocumentChunks:",
            chunkCount
        );


        // ==========================================
        // DOCUMENTS
        // ==========================================

        const documents =
            await Document.find({})
                .select(
                    "_id title processingStatus processingError collegeId isActive"
                )
                .sort({
                    createdAt: -1
                })
                .lean();


        console.log(
            "\n========== DOCUMENTS =========="
        );

        console.log(
            JSON.stringify(
                documents,
                null,
                2
            )
        );


        // ==========================================
        // CHUNKS SUMMARY
        // ==========================================

        const chunks =
            await DocumentChunk.find({})
                .select(
                    "_id documentId collegeId chunkIndex content embedding metadata"
                )
                .sort({
                    documentId: 1,
                    chunkIndex: 1
                })
                .limit(10)
                .lean();


        console.log(
            "\n========== CHUNKS SUMMARY =========="
        );


        if (!chunks.length) {

            console.log(
                "No document chunks found."
            );

        } else {

            for (
                const chunk of chunks
            ) {

                console.log(
                    "\nChunk:"
                );

                console.log({
                    id:
                        chunk._id,

                    documentId:
                        chunk.documentId,

                    collegeId:
                        chunk.collegeId,

                    chunkIndex:
                        chunk.chunkIndex,

                    contentPreview:
                        chunk.content
                            ?.substring(0, 150),

                    embeddingExists:
                        Array.isArray(
                            chunk.embedding
                        ),

                    embeddingDimensions:
                        Array.isArray(
                            chunk.embedding
                        )
                            ? chunk.embedding.length
                            : 0,

                    section:
                        chunk.metadata?.section,

                    source:
                        chunk.metadata?.source
                });
            }
        }


        // ==========================================
        // EMBEDDING SUMMARY
        // ==========================================

        const chunksWithEmbeddings =
            await DocumentChunk.countDocuments({
                embedding: {
                    $exists: true,
                    $ne: []
                }
            });


        const chunksWithoutEmbeddings =
            chunkCount -
            chunksWithEmbeddings;


        console.log(
            "\n========== EMBEDDING SUMMARY =========="
        );

        console.log(
            "Chunks with embeddings:",
            chunksWithEmbeddings
        );

        console.log(
            "Chunks without embeddings:",
            chunksWithoutEmbeddings
        );


        // ==========================================
        // FINAL RESULT
        // ==========================================

        console.log(
            "\n========== FINAL RESULT =========="
        );

        if (
            chunkCount > 0 &&
            chunksWithEmbeddings === chunkCount
        ) {

            console.log(
                "✅ All document chunks exist and have embeddings."
            );

        } else if (
            chunkCount > 0
        ) {

            console.log(
                "⚠️ Chunks exist, but some embeddings are missing."
            );

        } else {

            console.log(
                "❌ No document chunks found."
            );
        }


    } catch (error) {

        console.error(
            "\n❌ Check failed:"
        );

        console.error(
            error
        );

    } finally {

        await mongoose.disconnect();

        console.log(
            "\nMongoDB connection closed."
        );
    }
};


// ==========================================
// RUN
// ==========================================

checkChunks();