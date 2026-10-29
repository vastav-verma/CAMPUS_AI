import express from "express";

import protect from "../middleware/auth.middleware.js";
import attachTenant from "../middleware/tenant.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import { uploadProofImage } from "../middleware/upload.middleware.js";

import {
    createComplaint,
    getMyComplaints,
    getAssignedComplaints,
    getComplaintById,
    getComplaintStats,
    getComplaintAnalytics,
    updateComplaintStatus,
    assignComplaintToStaff,
    reopenComplaint,
    getComplaintProof
} from "../controllers/complaint.controller.js";

const router = express.Router();

router.use(protect, attachTenant);

// Static paths must come before "/:id"
router.get("/stats", getComplaintStats);

router.get(
    "/analytics",
    authorizeRoles("college_admin"),
    getComplaintAnalytics
);

router.get("/mine", authorizeRoles("student"), getMyComplaints);

router.get(
    "/assigned",
    authorizeRoles("staff", "college_admin"),
    getAssignedComplaints
);

router.post("/", authorizeRoles("student"), createComplaint);

router.get("/:id", getComplaintById);

router.get("/:id/proof", getComplaintProof);

router.patch(
    "/:id/status",
    authorizeRoles("staff", "college_admin"),
    uploadProofImage,
    updateComplaintStatus
);

router.patch(
    "/:id/assign",
    authorizeRoles("college_admin"),
    assignComplaintToStaff
);

router.patch(
    "/:id/reopen",
    authorizeRoles("student"),
    reopenComplaint
);

export default router;
