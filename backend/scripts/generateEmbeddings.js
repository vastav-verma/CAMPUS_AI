import "../src/config/env.js";

import connectDB from "../src/config/database.js";

import DocumentChunk from "../src/models/DocumentChunk.js";

import {
    generateEmbedding
} from "../src/services/embedding.service.js";


const generateEmbeddings = async () => {

    try {

        await connectDB();


        // ==========================================
        // FIND CHUNKS WITHOUT EMBEDDINGS
        // ==========================================

        const chunks =
            await DocumentChunk.find({
                $or: [
                    {
                        embedding: {
                            $exists: false
                        }
                    },
                    {
                        embedding: {
                            $size: 0
                        }
                    }
                ]
            }).sort({
                createdAt: 1
            });


        console.log(
            `Found ${chunks.length} chunks without embeddings.`
        );


        if (!chunks.length) {

            console.log(
                "All chunks already have embeddings."
            );

            process.exit(0);
        }


        // ==========================================
        // GENERATE EMBEDDING FOR EACH CHUNK
        // ==========================================

        for (
            let index = 0;
            index < chunks.length;
            index++
        ) {

            const chunk =
                chunks[index];


            console.log(
                `\nProcessing ${index + 1}/${chunks.length}`
            );

            console.log(
                `Chunk ID: ${chunk._id}`
            );


            try {

                const embedding =
                    await generateEmbedding(
                        chunk.content
                    );


                chunk.embedding =
                    embedding;


                await chunk.save();


                console.log(
                    `Embedding saved. Dimensions: ${embedding.length}`
                );


            } catch (error) {

                console.error(
                    `Failed for chunk ${chunk._id}:`,
                    error.message
                );
            }
        }


        console.log(
            "\nEmbedding generation completed."
        );


        process.exit(0);


    } catch (error) {

        console.error(
            "Embedding migration failed:",
            error
        );

        process.exit(1);
    }
};


generateEmbeddings();