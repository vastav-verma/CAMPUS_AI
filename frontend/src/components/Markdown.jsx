import { Fragment } from "react";

// Tiny, safe Markdown renderer for chatbot answers.
// Supports: #/##/### headings, - / * / 1. lists, **bold**, *italic*, `code`.
// Output is React elements only (no innerHTML), so it cannot inject HTML.

const renderInline = (text, keyPrefix) => {
    const parts = [];
    const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
    let last = 0;
    let match;
    let i = 0;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > last) parts.push(text.slice(last, match.index));

        const token = match[0];
        const key = `${keyPrefix}-${i++}`;

        if (token.startsWith("**")) {
            parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
        } else if (token.startsWith("`")) {
            parts.push(<code key={key}>{token.slice(1, -1)}</code>);
        } else {
            parts.push(<em key={key}>{token.slice(1, -1)}</em>);
        }

        last = match.index + token.length;
    }

    if (last < text.length) parts.push(text.slice(last));

    return parts;
};

const Markdown = ({ text }) => {
    const lines = String(text ?? "").replace(/\r/g, "").split("\n");
    const blocks = [];
    let list = null;
    let paragraph = [];

    const flushParagraph = () => {
        if (paragraph.length) {
            blocks.push({ type: "p", text: paragraph.join(" ") });
            paragraph = [];
        }
    };

    const flushList = () => {
        if (list) {
            blocks.push(list);
            list = null;
        }
    };

    for (const raw of lines) {
        const line = raw.trimEnd();
        const heading = line.match(/^(#{1,3})\s+(.*)$/);
        const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
        const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);

        if (!line.trim()) {
            flushParagraph();
            flushList();
        } else if (heading) {
            flushParagraph();
            flushList();
            blocks.push({ type: "h", level: heading[1].length, text: heading[2] });
        } else if (bullet || numbered) {
            flushParagraph();
            const ordered = Boolean(numbered);

            if (!list || list.ordered !== ordered) {
                flushList();
                list = { type: "list", ordered, items: [] };
            }

            list.items.push((bullet || numbered)[1]);
        } else {
            flushList();
            paragraph.push(line.trim());
        }
    }

    flushParagraph();
    flushList();

    return (
        <div className="md">
            {blocks.map((block, index) => {
                if (block.type === "h") {
                    const Tag = `h${block.level + 2}`;
                    return <Tag key={index}>{renderInline(block.text, `h${index}`)}</Tag>;
                }

                if (block.type === "list") {
                    const Tag = block.ordered ? "ol" : "ul";

                    return (
                        <Tag key={index}>
                            {block.items.map((item, i) => (
                                <li key={i}>{renderInline(item, `l${index}-${i}`)}</li>
                            ))}
                        </Tag>
                    );
                }

                return (
                    <Fragment key={index}>
                        <p>{renderInline(block.text, `p${index}`)}</p>
                    </Fragment>
                );
            })}
        </div>
    );
};

export default Markdown;
