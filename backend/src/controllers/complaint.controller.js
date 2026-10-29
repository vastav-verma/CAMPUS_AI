import * as complaintService from "../services/complaint.service.js";
import { resolveStoragePath } from "../services/storage.service.js";

// Express 5 forwards rejected promises to the central error handler,
// so controllers stay thin: no try/catch needed.

const ctx = (req) => ({
    collegeId: req.tenant.collegeId,
    user: req.user
});

const createComplaint = async (req, res) => {
    const { collegeId, user } = ctx(req);

    const complaint = await complaintService.createComplaint({
        collegeId,
        studentId: user.userId,
        body: req.body ?? {}
    });

    res.status(201).json({
        success: true,
        data: complaint,
        message:
            complaint.status === "assigned"
                ? "Complaint submitted and assigned to the concerned authority."
                : "Complaint submitted. The administrator will assign it shortly."
    });
};

const getMyComplaints = async (req, res) => {
    const { collegeId, user } = ctx(req);

    const { items, pagination } = await complaintService.listMine({
        collegeId,
        studentId: user.userId,
        query: req.query
    });

    res.json({ success: true, data: items, pagination });
};

const getAssignedComplaints = async (req, res) => {
    const { collegeId, user } = ctx(req);

    const { items, pagination } = await complaintService.listAssigned({
        collegeId,
        user,
        query: req.query
    });

    res.json({ success: true, data: items, pagination });
};

const getComplaintById = async (req, res) => {
    const { collegeId, user } = ctx(req);

    const complaint = await complaintService.getComplaint({
        id: req.params.id,
        collegeId,
        user
    });

    res.json({ success: true, data: complaint });
};

const getComplaintStats = async (req, res) => {
    const { collegeId, user } = ctx(req);

    const stats = await complaintService.getStats({ collegeId, user });

    res.json({ success: true, data: stats });
};

const getComplaintAnalytics = async (req, res) => {
    const { collegeId } = ctx(req);

    const data = await complaintService.getAnalytics({
        collegeId,
        days: parseInt(req.query.days, 10) || 14
    });

    res.json({ success: true, data });
};

const updateComplaintStatus = async (req, res) => {
    const { collegeId, user } = ctx(req);
    const body = req.body ?? {};

    const complaint = await complaintService.updateStatus({
        id: req.params.id,
        collegeId,
        user,
        status: body.status,
        remarks: body.remarks,
        file: req.file
    });

    res.json({
        success: true,
        data: complaint,
        message:
            complaint.status === "resolved"
                ? "Complaint marked as resolved. The student has been notified."
                : "Complaint marked as in progress."
    });
};

const assignComplaintToStaff = async (req, res) => {
    const { collegeId, user } = ctx(req);

    const complaint = await complaintService.assign({
        id: req.params.id,
        collegeId,
        admin: user,
        staffId: req.body?.staffId
    });

    res.json({
        success: true,
        data: complaint,
        message: "Complaint assigned successfully."
    });
};

const reopenComplaint = async (req, res) => {
    const { collegeId, user } = ctx(req);

    const complaint = await complaintService.reopen({
        id: req.params.id,
        collegeId,
        studentId: user.userId,
        reason: req.body?.reason
    });

    res.json({
        success: true,
        data: complaint,
        message: "Complaint reopened."
    });
};

const getComplaintProof = async (req, res) => {
    const { collegeId, user } = ctx(req);

    const proof = await complaintService.getProofFile({
        id: req.params.id,
        collegeId,
        user
    });

    res.set({
        "Content-Type": proof.mimeType,
        "Cache-Control": "private, max-age=3600"
    });

    res.sendFile(resolveStoragePath(proof.storageKey), (error) => {
        if (error && !res.headersSent) {
            res.status(404).json({
                success: false,
                message: "Proof file is not available."
            });
        }
    });
};

export {
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
};
