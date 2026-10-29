import express from "express";

import protect from "../middleware/auth.middleware.js";
import attachTenant from "../middleware/tenant.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";

import {
    listColleges,
    createCollege,
    setCollegeActive,
    setCollegePlan
} from "../controllers/college.controller.js";

const router = express.Router();

// Platform owner only.
router.use(protect, attachTenant, authorizeRoles("super_admin"));

router.get("/", listColleges);
router.post("/", createCollege);
router.patch("/:id/active", setCollegeActive);
router.patch("/:id/plan", setCollegePlan);

export default router;
