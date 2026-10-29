// Small CSV helpers (handles quoted fields and commas inside quotes).

export const parseCSV = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    const clean = text.replace(/^\uFEFF/, "");

    for (let i = 0; i < clean.length; i += 1) {
        const char = clean[i];

        if (inQuotes) {
            if (char === '"' && clean[i + 1] === '"') {
                field += '"';
                i += 1;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                field += char;
            }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ",") {
            row.push(field);
            field = "";
        } else if (char === "\n" || char === "\r") {
            if (char === "\r" && clean[i + 1] === "\n") i += 1;
            row.push(field);
            field = "";
            if (row.some((cell) => cell.trim() !== "")) rows.push(row);
            row = [];
        } else {
            field += char;
        }
    }

    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);

    return rows;
};

// -> array of objects keyed by lower-cased header
export const parseCSVObjects = (text) => {
    const [header, ...rows] = parseCSV(text);

    if (!header) return [];

    const keys = header.map((h) => h.trim().toLowerCase());

    return rows.map((cells) =>
        Object.fromEntries(keys.map((key, i) => [key, (cells[i] ?? "").trim()]))
    );
};

const escapeCell = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCSV = (rows) =>
    rows.map((row) => row.map(escapeCell).join(",")).join("\n");

export const downloadText = (filename, text, type = "text/csv") => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};
