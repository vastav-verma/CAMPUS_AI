import express from "express";

import protect from "../middleware/auth.middleware.js";
import attachTenant from "../middleware/tenant.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";

import {
    listStaff,
    createStaff,
    setStaffActive
} from "../controllers/staff.controller.js";

const router = express.Router();

router.use(protect, attachTenant, authorizeRoles("college_admin"));

router.get("/", listStaff);
router.post("/", createStaff);
router.patch("/:id/active", setStaffActive);

export default router;
