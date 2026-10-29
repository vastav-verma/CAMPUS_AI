import mongoose from "mongoose";

import DocumentChunk from "../../models/DocumentChunk.js";

import {
    generateEmbedding
} from "../embedding.service.js";


// ==========================================
// RETRIEVE RELEVANT CHUNKS
// ==========================================

const retrieveRelevantChunks = async ({
    query,
    collegeId,
    limit = 5
}) => {

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!query || !query.trim()) {

        throw new Error(
            "Search query is required."
        );
    }


    if (!collegeId) {

        throw new Error(
            "College ID is required."
        );
    }


    // ==========================================
    // CONVERT COLLEGE ID
    // ==========================================

    const collegeObjectId =
        new mongoose.Types.ObjectId(
            collegeId
        );


    // ==========================================
    // GENERATE QUERY EMBEDDING
    // ==========================================

    const queryEmbedding =
        await generateEmbedding(
            query
        );


    // ==========================================
    // VECTOR SEARCH
    // ==========================================

    const results =
        await DocumentChunk.aggregate([

            {
                $vectorSearch: {

                    index:
                        "document_chunks_vector_index",

                    path:
                        "embedding",

                    queryVector:
                        queryEmbedding,

                    numCandidates:
                        Math.max(
                            limit * 20,
                            100
                        ),

                    limit:

                        limit,

                    filter: {

                        collegeId:
                            collegeObjectId
                    }
                }
            },


            // ==================================
            // PROJECT REQUIRED FIELDS
            // ==================================

            {
                $project: {

                    _id: 1,

                    collegeId: 1,

                    documentId: 1,

                    chunkIndex: 1,

                    content: 1,

                    metadata: 1,

                    score: {

                        $meta:
                            "vectorSearchScore"
                    }
                }
            }

        ]);


    return results;
};


export {
    retrieveRelevantChunks
};