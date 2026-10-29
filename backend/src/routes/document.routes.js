import express from "express";

import {
    uploadDocument,
    getAllDocuments,
    getSingleDocument,
    removeDocument
} from "../controllers/document.controller.js";

import protect
    from "../middleware/auth.middleware.js";

import attachTenant
    from "../middleware/tenant.middleware.js";

import authorizeRoles
    from "../middleware/role.middleware.js";

import upload
    from "../middleware/upload.middleware.js";


const router =
    express.Router();


// ==========================================
// UPLOAD DOCUMENT
// ==========================================

router.post(

    "/upload",

    protect,

    attachTenant,

    authorizeRoles(
        "college_admin"
    ),

    upload.single(
        "document"
    ),

    uploadDocument
);


// ==========================================
// GET ALL DOCUMENTS
// ==========================================

router.get(

    "/",

    protect,

    attachTenant,

    authorizeRoles(
        "college_admin"
    ),

    getAllDocuments
);


// ==========================================
// GET SINGLE DOCUMENT
// ==========================================

router.get(

    "/:id",

    protect,

    attachTenant,

    authorizeRoles(
        "college_admin"
    ),

    getSingleDocument
);


// ==========================================
// DELETE DOCUMENT
// ==========================================

router.delete(

    "/:id",

    protect,

    attachTenant,

    authorizeRoles(
        "college_admin"
    ),

    removeDocument
);


export default router;