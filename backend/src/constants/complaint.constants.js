export const CATEGORIES = [
    "academics",
    "hostel",
    "infrastructure",
    "IT",
    "accounts",
    "placements",
    "transport",
    "other"
];

export const SEVERITIES = ["low", "medium", "high", "critical"];

export const STATUSES = [
    "submitted",
    "assigned",
    "in_progress",
    "resolved",
    "reopened"
];

// Complaints that still need someone's attention.
export const OPEN_STATUSES = [
    "submitted",
    "assigned",
    "in_progress",
    "reopened"
];

export const MAX_REOPENS = 3;

export const NOTIFICATION_TYPES = [
    "complaint_created",
    "complaint_assigned",
    "complaint_unassigned",
    "complaint_reassigned",
    "status_updated",
    "complaint_resolved",
    "complaint_reopened"
];
