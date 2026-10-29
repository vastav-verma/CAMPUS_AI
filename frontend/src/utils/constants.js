// Must match backend/src/constants/complaint.constants.js
export const CATEGORIES = [
    { value: "academics", label: "Academics" },
    { value: "hostel", label: "Hostel" },
    { value: "infrastructure", label: "Infrastructure" },
    { value: "IT", label: "IT / Network" },
    { value: "accounts", label: "Accounts & Fees" },
    { value: "placements", label: "Placements" },
    { value: "transport", label: "Transport" },
    { value: "other", label: "Other" }
];

export const SEVERITIES = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" }
];

export const STATUS_LABELS = {
    submitted: "Submitted",
    assigned: "Assigned",
    in_progress: "In Progress",
    resolved: "Resolved",
    reopened: "Reopened"
};

export const categoryLabel = (value) =>
    CATEGORIES.find((c) => c.value === value)?.label || value || "-";

export const severityLabel = (value) =>
    SEVERITIES.find((s) => s.value === value)?.label || value || "-";

export const getHomeRoute = (role) => {
    if (role === "super_admin") return "/super-admin";
    if (role === "college_admin") return "/admin";
    if (role === "staff") return "/staff";
    return "/chat";
};

// Where a notification about a complaint should take each role.
export const complaintLinkFor = (role, complaintId) => {
    const base =
        role === "college_admin"
            ? "/admin/complaints"
            : role === "staff"
              ? "/staff"
              : "/complaints";

    return `${base}?open=${complaintId}`;
};

export const formatDateTime = (value) =>
    value
        ? new Date(value).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short"
          })
        : "-";

export const apiError = (err, fallback) =>
    err?.response?.data?.message || fallback;

export const MAX_PROOF_SIZE = 5 * 1024 * 1024;
export const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];
