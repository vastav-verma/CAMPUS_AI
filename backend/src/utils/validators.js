import AppError from "./AppError.js";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const CODE_PATTERN = /^[A-Z0-9_]{2,20}$/;

export const isId = (value) => /^[a-f\d]{24}$/i.test(String(value));

export const assertPassword = (password) => {
    if (
        typeof password !== "string" ||
        password.length < 8 ||
        !/[A-Za-z]/.test(password) ||
        !/\d/.test(password)
    ) {
        throw new AppError(
            "Password must be at least 8 characters and contain a letter and a number.",
            400
        );
    }
};

export const assertEmail = (email) => {
    if (!EMAIL_PATTERN.test(email)) {
        throw new AppError("Enter a valid email address.", 400);
    }
};

// "PCTE Group of Institutes" -> "PCTE_GROUP_OF"
export const slugifyCode = (name) =>
    String(name)
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 14)
        .replace(/_+$/g, "");
