// ==========================================
// BUILD CONTEXT FROM RETRIEVED CHUNKS
// ==========================================

const buildContext = (chunks) => {

    if (!chunks || chunks.length === 0) {
        return "";
    }


    const context = chunks
        .map((chunk, index) => {

            const section =
                chunk.metadata?.section || "General";

            const source =
                chunk.metadata?.source || "College Knowledge Base";


            return `
SOURCE ${index + 1}

Section:
${section}

Source:
${source}

Content:
${chunk.content}
`;
        })
        .join(
            "\n-----------------------------\n"
        );


    return context.trim();
};


export default buildContext;