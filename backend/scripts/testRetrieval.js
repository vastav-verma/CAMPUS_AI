import "../src/config/env.js";

import connectDB
    from "../src/config/database.js";

import {
    retrieveRelevantChunks
} from "../src/services/rag/retrieval.service.js";


// ==========================================
// COLLEGE A
// ==========================================

const COLLEGE_ID =
    "6a8d4d1ab7bc811bf162e3d4";


// ==========================================
// TEST QUESTIONS
// ==========================================

const QUESTIONS = [

    "What is the internship policy?",

    "What are the rules for students?",

    "What is the placement policy?"

];


// ==========================================
// TEST RETRIEVAL
// ==========================================

const testRetrieval = async () => {

    try {

        await connectDB();


        console.log(
            "\n======================================"
        );

        console.log(
            "       RAG RETRIEVAL TEST"
        );

        console.log(
            "======================================\n"
        );


        for (
            const question of QUESTIONS
        ) {

            console.log(
                "\n--------------------------------------"
            );

            console.log(
                "QUESTION:"
            );

            console.log(
                question
            );

            console.log(
                "--------------------------------------\n"
            );


            const results =
                await retrieveRelevantChunks({

                    query:
                        question,

                    collegeId:
                        COLLEGE_ID,

                    limit:
                        5
                });


            console.log(
                `Retrieved ${results.length} chunks\n`
            );


            results.forEach(
                (result, index) => {

                    console.log(
                        `========== RESULT ${index + 1} ==========`
                    );


                    console.log(
                        "Score:",
                        result.score
                    );


                    console.log(
                        "College ID:",
                        result.collegeId
                    );


                    console.log(
                        "Document ID:",
                        result.documentId
                    );


                    console.log(
                        "Chunk Index:",
                        result.chunkIndex
                    );


                    console.log(
                        "\nContent:"
                    );


                    console.log(
                        result.content
                    );


                    console.log(
                        "\n"
                    );
                }
            );
        }


        console.log(
            "\n======================================"
        );

        console.log(
            "       RETRIEVAL TEST COMPLETED"
        );

        console.log(
            "======================================"
        );


        process.exit(0);


    } catch (error) {

        console.error(
            "\nRetrieval test failed:"
        );

        console.error(
            error.message
        );


        process.exit(1);
    }
};


testRetrieval();