import express from "express";

import protect from "../middleware/auth.middleware.js";
import attachTenant from "../middleware/tenant.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";

import {
    getMyCollege,
    updateSettings,
    getBilling
} from "../controllers/tenant.controller.js";

import {
    createInvite,
    listInvites,
    revokeInvite
} from "../controllers/invite.controller.js";

import {
    listUsers,
    setUserActive,
    importUsers
} from "../controllers/user.controller.js";

const router = express.Router();

router.use(protect, attachTenant);

// everyone
router.get("/college", getMyCollege);

// college admin
const admin = authorizeRoles("college_admin");

router.patch("/college", admin, updateSettings);
router.get("/billing", admin, getBilling);

router.get("/invites", admin, listInvites);
router.post("/invites", admin, createInvite);
router.delete("/invites/:id", admin, revokeInvite);

router.get("/users", admin, listUsers);
router.post("/users/import", admin, importUsers);
router.patch("/users/:id/active", admin, setUserActive);

export default router;
