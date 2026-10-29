// ==========================================
// MARKDOWN-AWARE RECURSIVE CHUNKER
// ==========================================

const DEFAULT_MAX_CHARACTERS = 1200;
const DEFAULT_OVERLAP = 200;


// ==========================================
// MAIN CHUNK FUNCTION
// ==========================================

const chunkMarkdown = (
    markdown,
    maxCharacters = DEFAULT_MAX_CHARACTERS,
    overlap = DEFAULT_OVERLAP
) => {

    if (!markdown || !markdown.trim()) {
        return [];
    }

    if (overlap >= maxCharacters) {
        throw new Error(
            "Overlap must be smaller than maxCharacters."
        );
    }


    // --------------------------------------
    // STEP 1: Split Markdown into sections
    // --------------------------------------

    const sections =
        splitIntoSections(markdown);


    const chunks = [];


    // --------------------------------------
    // STEP 2: Process every section
    // --------------------------------------

    for (const section of sections) {

        const content =
            section.content.trim();


        if (!content) {
            continue;
        }


        // ----------------------------------
        // Small section
        // ----------------------------------

        if (
            content.length <=
            maxCharacters
        ) {

            chunks.push({

                content,

                section:
                    section.title

            });

            continue;
        }


        // ----------------------------------
        // Large section
        // Recursive splitting
        // ----------------------------------

        const sectionChunks =
            recursiveSplit(

                content,

                maxCharacters,

                [
                    "\n\n",
                    "\n",
                    /(?<=[.!?])\s+/,
                    " ",
                    ""
                ]
            );


        // ----------------------------------
        // Add overlap
        // ----------------------------------

        const overlappingChunks =
            addOverlap(
                sectionChunks,
                overlap
            );


        overlappingChunks.forEach(
            chunk => {

                if (chunk.trim()) {

                    chunks.push({

                        content:
                            chunk.trim(),

                        section:
                            section.title

                    });

                }

            }
        );
    }


    return chunks;
};


// ==========================================
// SPLIT MARKDOWN INTO SECTIONS
// ==========================================

const splitIntoSections = (
    markdown
) => {

    const lines =
        markdown.split("\n");


    const sections = [];


    let currentTitle =
        "General";


    let currentContent = [];


    for (const line of lines) {

        // ----------------------------------
        // Detect Markdown heading
        // ----------------------------------

        if (
            /^#{1,6}\s+/.test(line)
        ) {

            // Save previous section
            if (
                currentContent.length > 0
            ) {

                const content =
                    currentContent
                        .join("\n")
                        .trim();


                if (content) {

                    sections.push({

                        title:
                            currentTitle,

                        content

                    });

                }
            }


            // New section
            currentTitle =
                line
                    .replace(
                        /^#{1,6}\s+/,
                        ""
                    )
                    .trim();


            currentContent = [];

        } else {

            currentContent.push(line);
        }
    }


    // --------------------------------------
    // Save final section
    // --------------------------------------

    if (
        currentContent.length > 0
    ) {

        const content =
            currentContent
                .join("\n")
                .trim();


        if (content) {

            sections.push({

                title:
                    currentTitle,

                content

            });
        }
    }


    return sections.filter(
        section =>
            section.content.length > 0
    );
};


// ==========================================
// RECURSIVE SPLITTING
// ==========================================

const recursiveSplit = (
    text,
    maxCharacters,
    separators,
    separatorIndex = 0
) => {

    const cleanText =
        text.trim();


    if (!cleanText) {
        return [];
    }


    // --------------------------------------
    // Already small enough
    // --------------------------------------

    if (
        cleanText.length <=
        maxCharacters
    ) {

        return [
            cleanText
        ];
    }


    // --------------------------------------
    // No separators left
    // Character fallback
    // --------------------------------------

    if (
        separatorIndex >=
        separators.length
    ) {

        return hardSplit(
            cleanText,
            maxCharacters
        );
    }


    const separator =
        separators[separatorIndex];


    // --------------------------------------
    // Character-level fallback
    // --------------------------------------

    if (separator === "") {

        return hardSplit(
            cleanText,
            maxCharacters
        );
    }


    // --------------------------------------
    // Split using current separator
    // --------------------------------------

    const parts =
        cleanText.split(separator);


    // If separator didn't actually split
    if (parts.length === 1) {

        return recursiveSplit(

            cleanText,

            maxCharacters,

            separators,

            separatorIndex + 1
        );
    }


    const result = [];

    let current = "";


    // --------------------------------------
    // Rebuild chunks without exceeding limit
    // --------------------------------------

    for (const part of parts) {

        const cleanPart =
            part.trim();


        if (!cleanPart) {
            continue;
        }


        // ----------------------------------
        // Part itself is too large
        // ----------------------------------

        if (
            cleanPart.length >
            maxCharacters
        ) {

            // Flush current content first
            if (current) {

                result.push(
                    current.trim()
                );

                current = "";
            }


            // Recursively split large part
            const smallerParts =
                recursiveSplit(

                    cleanPart,

                    maxCharacters,

                    separators,

                    separatorIndex + 1
                );


            result.push(
                ...smallerParts
            );

            continue;
        }


        // ----------------------------------
        // Try adding part to current chunk
        // ----------------------------------

        const candidate =
            current
                ? `${current} ${cleanPart}`
                : cleanPart;


        if (
            candidate.length <=
            maxCharacters
        ) {

            current =
                candidate;

        } else {

            // Save current chunk
            if (current) {

                result.push(
                    current.trim()
                );
            }


            current =
                cleanPart;
        }
    }


    // --------------------------------------
    // Save remaining content
    // --------------------------------------

    if (current) {

        result.push(
            current.trim()
        );
    }


    return result;
};


// ==========================================
// HARD CHARACTER SPLIT
// ==========================================

const hardSplit = (
    text,
    maxCharacters
) => {

    const chunks = [];


    let start = 0;


    while (
        start <
        text.length
    ) {

        const chunk =
            text
                .slice(
                    start,
                    start + maxCharacters
                )
                .trim();


        if (chunk) {

            chunks.push(
                chunk
            );
        }


        start +=
            maxCharacters;
    }


    return chunks;
};


// ==========================================
// ADD SEMANTIC OVERLAP
// ==========================================

const addOverlap = (
    chunks,
    overlap
) => {

    if (
        chunks.length <= 1 ||
        overlap <= 0
    ) {

        return chunks;
    }


    const result = [];


    for (
        let i = 0;
        i < chunks.length;
        i++
    ) {

        const current =
            chunks[i];


        // First chunk
        if (i === 0) {

            result.push(
                current
            );

            continue;
        }


        const previous =
            chunks[i - 1];


        // ----------------------------------
        // Take overlap from previous chunk
        // ----------------------------------

        const overlapText =
            getOverlapText(
                previous,
                overlap
            );


        const combined =
            `${overlapText} ${current}`
                .trim();


        result.push(
            combined
        );
    }


    return result;
};


// ==========================================
// GET OVERLAP WITHOUT BREAKING WORDS
// ==========================================

const getOverlapText = (
    text,
    overlap
) => {

    if (
        text.length <= overlap
    ) {

        return text;
    }


    const start =
        text.length -
        overlap;


    let overlapText =
        text.slice(start);


    // --------------------------------------
    // Avoid starting in middle of a word
    // --------------------------------------

    const firstSpace =
        overlapText.indexOf(" ");


    if (
        firstSpace !== -1
    ) {

        overlapText =
            overlapText
                .slice(firstSpace + 1);
    }


    return overlapText.trim();
};


// ==========================================
// EXPORT
// ==========================================

export default chunkMarkdown;