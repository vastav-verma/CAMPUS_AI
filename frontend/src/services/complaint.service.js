import api from "./api";

export const createComplaint = async (payload) =>
    (await api.post("/complaints", payload)).data;

export const getMyComplaints = async (params = {}) =>
    (await api.get("/complaints/mine", { params })).data;

export const getAssignedComplaints = async (params = {}) =>
    (await api.get("/complaints/assigned", { params })).data;

export const getComplaint = async (id) =>
    (await api.get(`/complaints/${encodeURIComponent(id)}`)).data;

export const getComplaintStats = async () =>
    (await api.get("/complaints/stats")).data;

// status: "in_progress" | "resolved"
// proof: optional image File (only used when resolving)
export const updateComplaintStatus = async (
    id,
    { status, remarks = "", proof = null }
) => {
    const formData = new FormData();

    formData.append("status", status);
    formData.append("remarks", remarks);

    if (proof) {
        formData.append("proof", proof);
    }

    return (
        await api.patch(
            `/complaints/${encodeURIComponent(id)}/status`,
            formData
        )
    ).data;
};

export const assignComplaint = async (id, staffId) =>
    (
        await api.patch(`/complaints/${encodeURIComponent(id)}/assign`, {
            staffId
        })
    ).data;

export const reopenComplaint = async (id, reason) =>
    (
        await api.patch(`/complaints/${encodeURIComponent(id)}/reopen`, {
            reason
        })
    ).data;

// Proof images are protected, so they are fetched with the JWT
// and shown through a temporary blob URL.
export const fetchProofBlob = async (id) =>
    (
        await api.get(`/complaints/${encodeURIComponent(id)}/proof`, {
            responseType: "blob"
        })
    ).data;

export const getComplaintAnalytics = async (days = 14) =>
    (await api.get("/complaints/analytics", { params: { days } })).data;
