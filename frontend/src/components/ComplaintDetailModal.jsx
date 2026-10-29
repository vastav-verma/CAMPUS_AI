import { useCallback, useEffect, useState } from "react";

import Modal from "./Modal";
import ProofImage from "./ProofImage";
import { StatusBadge, SeverityBadge } from "./StatusBadge";

import { getComplaint } from "../services/complaint.service";

import {
    apiError,
    categoryLabel,
    formatDateTime
} from "../utils/constants";

// Fetches and shows one complaint with its full timeline.
// `renderActions(complaint, reload)` adds role specific buttons.
const ComplaintDetailModal = ({
    complaintId,
    onClose,
    renderActions,
    refreshKey = 0
}) => {
    const [complaint, setComplaint] = useState(null);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const result = await getComplaint(complaintId);
            setComplaint(result.data);
            setError("");
        } catch (err) {
            setError(apiError(err, "Unable to load this complaint."));
        }
    }, [complaintId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load, refreshKey]);

    return (
        <Modal title="Complaint details" onClose={onClose} wide>
            {error && <div className="alert alert-error">{error}</div>}

            {!complaint && !error && <p className="muted">Loading...</p>}

            {complaint && (
                <div className="detail">
                    <div className="row-title">
                        <h3>{complaint.title}</h3>
                        <StatusBadge status={complaint.status} />
                        <SeverityBadge severity={complaint.severity} />
                    </div>

                    <dl className="facts">
                        <div>
                            <dt>Category</dt>
                            <dd>{categoryLabel(complaint.category)}</dd>
                        </div>
                        <div>
                            <dt>Submitted by</dt>
                            <dd>{complaint.studentId?.name || "-"}</dd>
                        </div>
                        <div>
                            <dt>Assigned to</dt>
                            <dd>
                                {complaint.assignedTo
                                    ? `${complaint.assignedTo.name} (${categoryLabel(
                                          complaint.assignedTo.department
                                      )})`
                                    : "Not assigned yet"}
                            </dd>
                        </div>
                        <div>
                            <dt>Submitted on</dt>
                            <dd>{formatDateTime(complaint.createdAt)}</dd>
                        </div>
                    </dl>

                    <h4>Description</h4>
                    <p className="pre">{complaint.description}</p>

                    {complaint.status === "resolved" && (
                        <div className="resolution">
                            <h4>Resolution</h4>
                            <p className="pre">
                                {complaint.resolutionRemarks}
                            </p>

                            <p className="muted">
                                Resolved by{" "}
                                {complaint.resolvedBy?.name || "staff"} on{" "}
                                {formatDateTime(complaint.resolvedAt)}
                            </p>

                            {complaint.proof && (
                                <ProofImage complaintId={complaint._id} />
                            )}
                        </div>
                    )}

                    <h4>Timeline</h4>
                    <ol className="timeline">
                        {complaint.statusHistory.map((entry, index) => (
                            <li key={index}>
                                <StatusBadge status={entry.status} />
                                <span className="muted">
                                    {formatDateTime(entry.at)} ·{" "}
                                    {entry.changedBy?.name || "System"}
                                </span>
                                {entry.note && <p>{entry.note}</p>}
                            </li>
                        ))}
                    </ol>

                    {renderActions && (
                        <div className="detail-actions">
                            {renderActions(complaint, load)}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default ComplaintDetailModal;
