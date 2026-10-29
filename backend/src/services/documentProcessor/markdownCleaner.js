const cleanMarkdown = (markdown) => {

    if (!markdown) {
        return "";
    }


    let cleaned = markdown;


    // Remove excessive spaces
    cleaned = cleaned.replace(
        /[ \t]+/g,
        " "
    );


    // Remove excessive blank lines
    cleaned = cleaned.replace(
        /\n{3,}/g,
        "\n\n"
    );


    // Normalize heading spacing
    cleaned = cleaned.replace(
        /^#+\s*/gm,
        match => match.trimEnd() + " "
    );


    return cleaned.trim();
};


export default cleanMarkdown;