import { PDFParse } from "pdf-parse";


const pdfToMarkdown = async (buffer) => {

    if (!buffer) {
        throw new Error(
            "PDF buffer is required."
        );
    }

    const parser = new PDFParse({
        data: buffer
    });

    const result = await parser.getText();

    await parser.destroy();

    const text = result.text?.trim();

    if (!text) {
        throw new Error(
            "Could not extract readable text from PDF."
        );
    }

    const markdown =
        convertTextToMarkdown(text);

    return markdown;
};


const convertTextToMarkdown = (text) => {

    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    const markdownLines = [];

    for (const line of lines) {

        if (isLikelyHeading(line)) {

            markdownLines.push(
                `## ${line}`
            );

        } else {

            markdownLines.push(line);
        }
    }

    return markdownLines.join("\n\n");
};


const isLikelyHeading = (line) => {

    if (line.length > 100) {
        return false;
    }

    if (
        /^chapter\s+/i.test(line) ||
        /^unit\s+/i.test(line) ||
        /^section\s+/i.test(line)
    ) {
        return true;
    }

    if (
        line.length >= 3 &&
        line === line.toUpperCase() &&
        /[A-Z]/.test(line)
    ) {
        return true;
    }

    return false;
};


export default pdfToMarkdown;