import { ListSkeleton } from "./Skeleton";
import { StatusBadge, SeverityBadge } from "./StatusBadge";
import { categoryLabel, formatDateTime } from "../utils/constants";

// Generic complaint rows. `renderActions(complaint)` lets each page
// add its own buttons (resolve, assign, ...).
const ComplaintList = ({
    complaints,
    onOpen,
    renderActions,
    showStudent = false,
    showAssignee = false,
    loading = false,
    emptyText = "No complaints found."
}) => {
    if (loading && complaints.length === 0) {
        return <ListSkeleton />;
    }

    if (complaints.length === 0) {
        return <p className="empty">{emptyText}</p>;
    }

    return (
        <div className="list">
            {complaints.map((complaint) => (
                <article className="row" key={complaint._id}>
                    <div
                        className="row-main"
                        onClick={() => onOpen(complaint._id)}
                    >
                        <div className="row-title">
                            <h3>{complaint.title}</h3>
                            <StatusBadge status={complaint.status} />
                            <SeverityBadge severity={complaint.severity} />
                        </div>

                        <p className="row-meta">
                            {categoryLabel(complaint.category)}
                            {showStudent &&
                                ` · By ${complaint.studentId?.name || "Student"}`}
                            {showAssignee &&
                                ` · ${
                                    complaint.assignedTo
                                        ? `Assigned to ${complaint.assignedTo.name}`
                                        : "Unassigned"
                                }`}
                            {` · ${formatDateTime(complaint.createdAt)}`}
                        </p>

                        <p className="row-desc">
                            {complaint.description}
                        </p>
                    </div>

                    <div className="row-actions">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => onOpen(complaint._id)}
                        >
                            View
                        </button>

                        {renderActions?.(complaint)}
                    </div>
                </article>
            ))}
        </div>
    );
};

export default ComplaintList;
