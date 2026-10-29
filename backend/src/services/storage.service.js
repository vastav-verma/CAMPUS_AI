import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import AppError from "../utils/AppError.js";

// All uploaded files live under this directory (outside any public
// static folder). Files are only ever served through authenticated
// API routes. To move to S3 / Cloudinary later, only this file changes.
const UPLOAD_ROOT = path.resolve(
    process.env.UPLOAD_DIR || "uploads"
);

const EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
};

// Never trust the client-supplied MIME type: check the file signature.
const detectImageType = (buffer) => {
    if (!buffer || buffer.length < 12) return null;

    if (
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
    ) {
        return "image/jpeg";
    }

    if (
        buffer
            .subarray(0, 8)
            .equals(
                Buffer.from([
                    0x89, 0x50, 0x4e, 0x47,
                    0x0d, 0x0a, 0x1a, 0x0a
                ])
            )
    ) {
        return "image/png";
    }

    if (
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
        return "image/webp";
    }

    return null;
};

const resolveStoragePath = (storageKey) => {
    const fullPath = path.resolve(UPLOAD_ROOT, storageKey);

    // Guard against path traversal.
    if (!fullPath.startsWith(UPLOAD_ROOT + path.sep)) {
        throw new AppError("Invalid file path.", 400);
    }

    return fullPath;
};

const saveProofImage = async ({
    collegeId,
    buffer,
    originalName
}) => {
    const mimeType = detectImageType(buffer);

    if (!mimeType) {
        throw new AppError(
            "The uploaded file is not a valid JPG, PNG or WEBP image.",
            400
        );
    }

    const storageKey = path.posix.join(
        "proofs",
        String(collegeId),
        `${crypto.randomUUID()}${EXTENSIONS[mimeType]}`
    );

    const fullPath = resolveStoragePath(storageKey);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer, { flag: "wx" });

    return {
        storageKey,
        originalName: String(originalName || "").slice(0, 200),
        mimeType,
        size: buffer.length
    };
};

// Best-effort delete: never throws.
const deleteStoredFile = async (storageKey) => {
    if (!storageKey) return;

    try {
        await fs.unlink(resolveStoragePath(storageKey));
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Failed to delete file:", error.message);
        }
    }
};

export {
    saveProofImage,
    deleteStoredFile,
    resolveStoragePath
};
