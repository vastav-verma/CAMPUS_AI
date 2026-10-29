import Groq from "groq-sdk";


const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


// ==========================================
// GENERATE ANSWER FROM RETRIEVED CONTEXT
// ==========================================

const generateAnswer = async ({
    question,
    context,
    conversationHistory = []
}) => {

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!question || !question.trim()) {

        throw new Error(
            "Question is required."
        );
    }


    if (!context || !context.trim()) {

        return "I could not find relevant information in the college knowledge base.";
    }


    // ==========================================
    // SYSTEM PROMPT
    // ==========================================

    const systemPrompt = `
You are an AI assistant for a college.

Your job is to answer student questions using ONLY the
information provided in the CURRENT CONTEXT.

IMPORTANT RULES:

1. Use ONLY the provided CURRENT CONTEXT to provide
   factual information.

2. NEVER invent, assume, guess, or add information that
   is not present in the CURRENT CONTEXT.

3. Previous conversation history may be used ONLY to
   understand what the student is referring to.

4. Do NOT use previous conversation history as a source
   of factual information if that information is not
   present in the CURRENT CONTEXT.

5. If the required factual information is not available
   in the CURRENT CONTEXT, clearly say:

   "I could not find this information in the college knowledge base."

6. Understand follow-up questions using the previous
   conversation when necessary.

   Example:

   Previous:
   Student: What is the placement fee?
   Assistant: The placement fee is Rs 2500.

   Current:
   Student: Is it refundable?

   Understand "it" as the placement fee, but verify the
   refund information ONLY from the CURRENT CONTEXT.

7. Distinguish between specific and broad questions.

8. For SPECIFIC questions:
   Give a direct and precise answer containing the
   relevant information from the CURRENT CONTEXT.

9. For BROAD questions such as:
   - "What is the placement policy?"
   - "What are the internship rules?"
   - "Tell me about the attendance policy."
   - "Explain the hostel rules."

   provide a COMPLETE and WELL-STRUCTURED summary of
   ALL relevant information available in the CURRENT CONTEXT.

10. Do NOT answer a broad question using only one small
    part of the CURRENT CONTEXT if other relevant
    information is available.

11. Preserve important:
    - names
    - dates
    - numbers
    - percentages
    - fees
    - eligibility criteria
    - conditions
    - deadlines
    - rules
    - restrictions

    exactly as provided in the CURRENT CONTEXT.

12. For longer answers, use headings, numbered lists,
    or bullet points when appropriate.

13. Do not repeat the same information unnecessarily.

14. Do not use outside knowledge.

15. Do not mention:
    - RAG
    - embeddings
    - vector search
    - chunks
    - database
    - retrieval
    - internal system

16. Do not expose document IDs, college IDs, or any
    internal system information.

17. If the CURRENT CONTEXT contains only partial
    information, provide the available information and
    clearly state that the remaining information could
    not be found.

18. Keep the answer natural and student-friendly.

19. Accuracy is more important than being brief.
`;


    // ==========================================
    // FORMAT CONVERSATION HISTORY
    // ==========================================

    const formattedHistory =
        conversationHistory
            .map((message) => {

                return `${message.role.toUpperCase()}: ${message.content}`;

            })
            .join("\n\n");


    // ==========================================
    // USER PROMPT
    // ==========================================

    const userPrompt = `
CURRENT CONTEXT:

${context}


PREVIOUS CONVERSATION:

${formattedHistory || "No previous conversation."}


CURRENT STUDENT QUESTION:

${question}


INSTRUCTIONS:

First understand the current student's question using
the previous conversation if necessary.

Then determine whether the current question is
SPECIFIC or BROAD.

If the question is SPECIFIC:
Give a direct answer using the relevant information
from the CURRENT CONTEXT.

If the question is BROAD:
Give a complete and well-structured summary of ALL
relevant information available in the CURRENT CONTEXT.

Previous conversation can help resolve references such
as "it", "they", "that rule", "the above", etc.

However, factual claims MUST come from the CURRENT CONTEXT.

Use ONLY the provided CURRENT CONTEXT for factual
information.

Do not make assumptions or use outside knowledge.
`;


    // ==========================================
    // GROQ REQUEST
    // ==========================================

    const completion =
        await groq.chat.completions.create({

            model:
                process.env.GROQ_MODEL ||
                "openai/gpt-oss-120b",

            messages: [

                {
                    role: "system",
                    content: systemPrompt
                },

                {
                    role: "user",
                    content: userPrompt
                }

            ],

            temperature: 0.2,

            max_tokens: 2000
        });


    // ==========================================
    // DEBUG GROQ RESPONSE
    // ==========================================

    console.log(
        "\n========== GROQ RESPONSE =========="
    );

    console.log(
        JSON.stringify(
            completion,
            null,
            2
        )
    );

    console.log(
        "====================================\n"
    );


    // ==========================================
    // EXTRACT ANSWER
    // ==========================================

    const answer =
        completion
            ?.choices?.[0]
            ?.message
            ?.content
            ?.trim();


    // ==========================================
    // CHECK ANSWER
    // ==========================================

    if (!answer) {

        console.error(
            "Groq returned an empty answer."
        );

        console.error(
            "Choices:",
            completion?.choices
        );

        throw new Error(
            "Failed to generate an answer."
        );
    }


    // ==========================================
    // LOG FINAL ANSWER
    // ==========================================

    console.log(
        "\n========== GENERATED ANSWER =========="
    );

    console.log(answer);

    console.log(
        "======================================\n"
    );


    return answer;
};


export default generateAnswer;