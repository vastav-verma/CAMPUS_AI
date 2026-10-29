import { STATUS_LABELS, severityLabel } from "../utils/constants";

export const StatusBadge = ({ status }) => (
    <span className={`badge status-${status}`}>
        {STATUS_LABELS[status] || status}
    </span>
);

export const SeverityBadge = ({ severity }) => (
    <span className={`badge sev-${severity}`}>
        {severityLabel(severity)}
    </span>
);
