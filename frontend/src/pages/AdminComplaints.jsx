import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import Pager from "../components/Pager";
import StatsRow from "../components/StatsRow";
import ComplaintList from "../components/ComplaintList";
import ComplaintDetailModal from "../components/ComplaintDetailModal";

import {
    getAssignedComplaints,
    getComplaintStats,
    assignComplaint
} from "../services/complaint.service";

import { getStaff } from "../services/staff.service";

import {
    CATEGORIES,
    SEVERITIES,
    STATUS_LABELS,
    apiError,
    categoryLabel
} from "../utils/constants";

const STAT_ITEMS = [
    { key: "total", label: "Total" },
    { key: "submitted", label: "Unassigned" },
    { key: "assigned", label: "Assigned" },
    { key: "in_progress", label: "In progress" },
    { key: "reopened", label: "Reopened" },
    { key: "resolved", label: "Resolved" }
];

const AdminComplaints = () => {
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const openId = params.get("open");

    const [complaints, setComplaints] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [stats, setStats] = useState(null);
    const [staff, setStaff] = useState([]);

    const [filters, setFilters] = useState({
        status: "",
        category: "",
        severity: "",
        assignedTo: "",
        q: ""
    });
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [assignTarget, setAssignTarget] = useState(null);
    const [staffId, setStaffId] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const loadData = useCallback(async () => {
        setLoading(true);

        const query = { page, limit: 10 };
        Object.entries(filters).forEach(([key, value]) => {
            if (value) query[key] = value;
        });

        try {
            const [list, statResult] = await Promise.all([
                getAssignedComplaints(query),
                getComplaintStats()
            ]);

            setComplaints(list.data || []);
            setPagination(list.pagination);
            setStats(statResult.data);
            setError("");
        } catch (err) {
            setError(apiError(err, "Unable to load complaints."));
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    useEffect(() => {
        getStaff({ active: "true" })
            .then((result) => setStaff(result.data || []))
            .catch(() => setStaff([]));
    }, []);

    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const openAssign = (complaint) => {
        setAssignTarget(complaint);
        setStaffId("");
        setAssignError("");
    };

    const submitAssign = async (event) => {
        event.preventDefault();

        if (!staffId) {
            setAssignError("Please select a staff member.");
            return;
        }

        setAssigning(true);
        setAssignError("");

        try {
            const result = await assignComplaint(assignTarget._id, staffId);
            setAssignTarget(null);
            toast.success(result.message);
            setRefreshKey((k) => k + 1);
            await loadData();
        } catch (err) {
            setAssignError(apiError(err, "Unable to assign the complaint."));
        } finally {
            setAssigning(false);
        }
    };

    const assignButton = (complaint) =>
        complaint.status === "resolved" ? null : (
            <button
                type="button"
                className="btn btn-primary"
                onClick={() => openAssign(complaint)}
            >
                {complaint.assignedTo ? "Reassign" : "Assign"}
            </button>
        );

    // Matching department first, then everyone else.
    const sortedStaff = assignTarget
        ? [...staff].sort(
              (a, b) =>
                  Number(b.department === assignTarget.category) -
                  Number(a.department === assignTarget.category)
          )
        : [];

    return (
        <div className="legacy-page">

            <main className="page page">
                <header className="page-head">
                    <div>
                        <p className="eyebrow">ADMINISTRATION</p>
                        <h1>All Complaints</h1>
                        <p className="muted">
                            Monitor every complaint and assign unassigned
                            ones to the right staff member.
                        </p>
                    </div>
                </header>

                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                    </div>
                )}

                <StatsRow stats={stats} items={STAT_ITEMS} />

                <section className="card">
                    <form
                        className="filters"
                        onSubmit={(e) => {
                            e.preventDefault();
                            setFilter("q", search.trim());
                        }}
                    >
                        <input
                            type="search"
                            placeholder="Search by title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            aria-label="Status"
                            value={filters.status}
                            onChange={(e) =>
                                setFilter("status", e.target.value)
                            }
                        >
                            <option value="">All statuses</option>
                            {Object.entries(STATUS_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </select>

                        <select
                            aria-label="Category"
                            value={filters.category}
                            onChange={(e) =>
                                setFilter("category", e.target.value)
                            }
                        >
                            <option value="">All categories</option>
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>

                        <select
                            aria-label="Priority"
                            value={filters.severity}
                            onChange={(e) =>
                                setFilter("severity", e.target.value)
                            }
                        >
                            <option value="">All priorities</option>
                            {SEVERITIES.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>

                        <select
                            aria-label="Assignment"
                            value={filters.assignedTo}
                            onChange={(e) =>
                                setFilter("assignedTo", e.target.value)
                            }
                        >
                            <option value="">Everyone</option>
                            <option value="unassigned">Unassigned only</option>
                            {staff.map((s) => (
                                <option key={s._id} value={s._id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>

                        <button type="submit" className="btn btn-ghost">
                            Search
                        </button>
                    </form>

                    <ComplaintList
                            loading={loading}
                            complaints={complaints}
                            showStudent
                            showAssignee
                            onOpen={(id) => setParams({ open: id })}
                            renderActions={assignButton}
                        />

                    <Pager pagination={pagination} onChange={setPage} />
                </section>
            </main>

            {openId && (
                <ComplaintDetailModal
                    complaintId={openId}
                    refreshKey={refreshKey}
                    onClose={() => setParams({}, { replace: true })}
                    renderActions={assignButton}
                />
            )}

            {assignTarget && (
                <Modal
                    title={
                        assignTarget.assignedTo
                            ? "Reassign complaint"
                            : "Assign complaint"
                    }
                    onClose={() => setAssignTarget(null)}
                >
                    <form className="form" onSubmit={submitAssign}>
                        <p className="muted">
                            <strong>{assignTarget.title}</strong>
                            <br />
                            Category: {categoryLabel(assignTarget.category)}
                        </p>

                        {assignError && (
                            <div className="alert alert-error">
                                {assignError}
                            </div>
                        )}

                        <label htmlFor="assign-staff">Staff member</label>
                        <select
                            id="assign-staff"
                            value={staffId}
                            onChange={(e) => setStaffId(e.target.value)}
                            required
                        >
                            <option value="">Select staff...</option>
                            {sortedStaff.map((s) => (
                                <option key={s._id} value={s._id}>
                                    {s.name} · {categoryLabel(s.department)} ·{" "}
                                    {s.openComplaints} open
                                    {s.department === assignTarget.category
                                        ? " (recommended)"
                                        : ""}
                                </option>
                            ))}
                        </select>

                        {staff.length === 0 && (
                            <p className="muted">
                                No active staff yet. Create staff accounts
                                from the Staff page first.
                            </p>
                        )}

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setAssignTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={assigning}
                            >
                                {assigning ? "Assigning..." : "Assign"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default AdminComplaints;
