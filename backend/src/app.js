
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import documentRoutes from "./routes/document.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";

import complaintRoutes from "./routes/complaint.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import collegeRoutes from "./routes/college.routes.js";
import publicRoutes from "./routes/public.routes.js";
import tenantRoutes from "./routes/tenant.routes.js";

const app = express();

// ==========================================
// Security headers
// ==========================================

app.disable("x-powered-by");

// Needed so rate limiting sees the real client IP behind a proxy/load balancer
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin"
        }
    })
);

// ==========================================
// CORS
// ==========================================

const allowedOrigins = (
    process.env.CLIENT_URL || ""
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
    throw new Error(
        "CLIENT_URL must be configured in production."
    );
}

app.use(
    cors({
        origin(origin, callback) {
            // Requests without Origin can include server-to-server
            // requests. Authentication is still required for protected APIs.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Origin is not allowed by CORS.")
            );
        },
        credentials: true,
        methods: [
            "GET",
            "POST",
            "PATCH",
            "PUT",
            "DELETE",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

// ==========================================
// Body parsing
// ==========================================

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb"
    })
);

// ==========================================
// Cookie parser
// ==========================================

app.use(cookieParser());

// ==========================================
// Health check
// ==========================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AI Campus Assistant API is running."
    });
});

// ==========================================
// Existing routes
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/conversations", conversationRoutes);

// ==========================================
// Complaint management routes
// ==========================================

app.use("/api/complaints", complaintRoutes);

// ==========================================
// Notification routes
// ==========================================

app.use("/api/notifications", notificationRoutes);

// ==========================================
// Staff management routes (college admin)
// ==========================================

app.use("/api/staff", staffRoutes);

// ==========================================
// College onboarding (super admin)
// ==========================================

app.use("/api/colleges", collegeRoutes);

// ==========================================
// SaaS: public signup / invites / branding
// ==========================================

app.use("/api/public", publicRoutes);

// ==========================================
// SaaS: workspace (settings, billing, invites, users)
// ==========================================

app.use("/api/workspace", tenantRoutes);

// ==========================================
// 404 handler
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

// ==========================================
// Central error handler
// ==========================================

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = Number.isInteger(err.statusCode)
        ? err.statusCode
        : 500;

    let message = err.message || "Request failed.";

    // Upload errors (file too large, unexpected field, ...)
    if (err.name === "MulterError") {
        statusCode = 400;
        message =
            err.code === "LIMIT_FILE_SIZE"
                ? "File is too large."
                : "Invalid file upload.";
    }

    // Mongoose validation / cast problems are client errors.
    if (err.name === "ValidationError" || err.name === "CastError") {
        statusCode = 400;
        message = "Invalid data submitted.";
    }

    if (statusCode >= 500) {
        // Send detailed errors to your server-side logger,
        // not to the client.
        console.error("API error:", err);
    }

    res.status(statusCode).json({
        success: false,
        message:
            statusCode >= 500
                ? "An unexpected server error occurred."
                : message
    });
});

export default app;
