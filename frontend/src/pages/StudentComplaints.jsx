import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import Pager from "../components/Pager";
import StatsRow from "../components/StatsRow";
import ComplaintList from "../components/ComplaintList";
import ComplaintDetailModal from "../components/ComplaintDetailModal";

import {
    createComplaint,
    getMyComplaints,
    getComplaintStats,
    reopenComplaint
} from "../services/complaint.service";

import {
    CATEGORIES,
    SEVERITIES,
    STATUS_LABELS,
    apiError
} from "../utils/constants";

const EMPTY_FORM = {
    title: "",
    description: "",
    category: "academics",
    severity: "medium"
};

const STAT_ITEMS = [
    { key: "total", label: "Total" },
    { key: "assigned", label: "Assigned" },
    { key: "in_progress", label: "In progress" },
    { key: "resolved", label: "Resolved" }
];

const StudentComplaints = () => {
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const openId = params.get("open");

    const [form, setForm] = useState(EMPTY_FORM);
    const [complaints, setComplaints] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [stats, setStats] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [reopenTarget, setReopenTarget] = useState(null);
    const [reopenReason, setReopenReason] = useState("");
    const [reopening, setReopening] = useState(false);
    const [reopenError, setReopenError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const loadData = useCallback(async () => {
        setLoading(true);

        try {
            const [list, statResult] = await Promise.all([
                getMyComplaints({
                    page,
                    limit: 10,
                    ...(statusFilter && { status: statusFilter })
                }),
                getComplaintStats()
            ]);

            setComplaints(list.data || []);
            setPagination(list.pagination);
            setStats(statResult.data);
            setError("");
        } catch (err) {
            setError(apiError(err, "Unable to load your complaints."));
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.title.trim() || !form.description.trim()) {
            setError("Please enter both a title and a description.");
            return;
        }

        setSubmitting(true);

        try {
            const result = await createComplaint({
                ...form,
                title: form.title.trim(),
                description: form.description.trim()
            });

            setForm(EMPTY_FORM);
            toast.success(result.message);

            if (page !== 1 || statusFilter) {
                setPage(1);
                setStatusFilter("");
            } else {
                await loadData();
            }
        } catch (err) {
            setError(apiError(err, "Unable to submit the complaint."));
        } finally {
            setSubmitting(false);
        }
    };

    const submitReopen = async (event) => {
        event.preventDefault();
        setReopening(true);
        setReopenError("");

        try {
            await reopenComplaint(reopenTarget._id, reopenReason);
            setReopenTarget(null);
            setReopenReason("");
            toast.success("Complaint reopened. The concerned authority has been notified.");
            setRefreshKey((k) => k + 1);
            await loadData();
        } catch (err) {
            setReopenError(apiError(err, "Unable to reopen the complaint."));
        } finally {
            setReopening(false);
        }
    };

    return (
        <div className="legacy-page">

            <main className="page page">
                <header className="page-head">
                    <div>
                        <p className="eyebrow">STUDENT PORTAL</p>
                        <h1>My Complaints</h1>
                        <p className="muted">
                            Submit a complaint and track it until it is
                            resolved. You will be notified at every step.
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
                    <h2>Submit a complaint</h2>

                    <form className="form" onSubmit={handleSubmit}>
                        <label htmlFor="c-title">Title</label>
                        <input
                            id="c-title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            maxLength={150}
                            placeholder="Briefly describe the issue"
                            required
                        />

                        <div className="grid-2">
                            <div>
                                <label htmlFor="c-category">Category</label>
                                <select
                                    id="c-category"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="c-severity">Priority</label>
                                <select
                                    id="c-severity"
                                    name="severity"
                                    value={form.severity}
                                    onChange={handleChange}
                                >
                                    {SEVERITIES.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <label htmlFor="c-desc">Description</label>
                        <textarea
                            id="c-desc"
                            name="description"
                            rows={5}
                            maxLength={5000}
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Explain the issue with all relevant details"
                            required
                        />

                        <div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? "Submitting..." : "Submit complaint"}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="card">
                    <div className="card-head">
                        <h2>Complaint history</h2>

                        <select
                            aria-label="Filter by status"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All statuses</option>
                            {Object.entries(STATUS_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </select>
                    </div>

                    <ComplaintList
                            loading={loading}
                            complaints={complaints}
                            showAssignee
                            emptyText="You haven't submitted any complaints yet."
                            onOpen={(id) => setParams({ open: id })}
                            renderActions={(c) =>
                                c.status === "resolved" ? (
                                    <button
                                        type="button"
                                        className="btn btn-warn"
                                        onClick={() => setReopenTarget(c)}
                                    >
                                        Not solved? Reopen
                                    </button>
                                ) : null
                            }
                        />

                    <Pager pagination={pagination} onChange={setPage} />
                </section>
            </main>

            {openId && (
                <ComplaintDetailModal
                    complaintId={openId}
                    refreshKey={refreshKey}
                    onClose={() => setParams({}, { replace: true })}
                    renderActions={(c) =>
                        c.status === "resolved" ? (
                            <button
                                type="button"
                                className="btn btn-warn"
                                onClick={() => setReopenTarget(c)}
                            >
                                Not solved? Reopen
                            </button>
                        ) : null
                    }
                />
            )}

            {reopenTarget && (
                <Modal
                    title="Reopen complaint"
                    onClose={() => setReopenTarget(null)}
                >
                    <form className="form" onSubmit={submitReopen}>
                        <p className="muted">
                            <strong>{reopenTarget.title}</strong>
                        </p>

                        {reopenError && (
                            <div className="alert alert-error">
                                {reopenError}
                            </div>
                        )}

                        <label htmlFor="reopen-reason">
                            Why is the issue still not solved?
                        </label>
                        <textarea
                            id="reopen-reason"
                            rows={4}
                            maxLength={1000}
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            required
                        />

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setReopenTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-warn"
                                disabled={reopening}
                            >
                                {reopening ? "Reopening..." : "Reopen complaint"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default StudentComplaints;
