import { GoogleGenAI } from "@google/genai";


const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ==========================================
// GENERATE EMBEDDING
// ==========================================

const generateEmbedding = async (text) => {

    if (!text || !text.trim()) {

        throw new Error(
            "Text is required for embedding."
        );
    }


    const response =
        await ai.models.embedContent({

            model:
                "gemini-embedding-001",

            contents:
                text
        });


    const embedding =
        response.embeddings?.[0]?.values;


    if (!embedding) {

        throw new Error(
            "Failed to generate embedding."
        );
    }


    return embedding;
};


export {
    generateEmbedding
};