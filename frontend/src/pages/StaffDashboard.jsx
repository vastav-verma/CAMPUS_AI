import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useToast } from "../context/ToastContext";
import Pager from "../components/Pager";
import StatsRow from "../components/StatsRow";
import ComplaintList from "../components/ComplaintList";
import ResolveModal from "../components/ResolveModal";
import ComplaintDetailModal from "../components/ComplaintDetailModal";

import { useAuth } from "../context/AuthContext";

import {
    getAssignedComplaints,
    getComplaintStats,
    updateComplaintStatus
} from "../services/complaint.service";

import { apiError, categoryLabel } from "../utils/constants";

const TABS = [
    { value: "", label: "All" },
    { value: "assigned", label: "New" },
    { value: "in_progress", label: "In progress" },
    { value: "reopened", label: "Reopened" },
    { value: "resolved", label: "Resolved" }
];

const STAT_ITEMS = [
    { key: "assigned", label: "New" },
    { key: "in_progress", label: "In progress" },
    { key: "reopened", label: "Reopened" },
    { key: "resolved", label: "Resolved" }
];

const StaffDashboard = () => {
    const toast = useToast();
    const { user } = useAuth();
    const [params, setParams] = useSearchParams();
    const openId = params.get("open");

    const [complaints, setComplaints] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [stats, setStats] = useState(null);
    const [tab, setTab] = useState("");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState("");
    const [resolveTarget, setResolveTarget] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const loadData = useCallback(async () => {
        setLoading(true);

        try {
            const [list, statResult] = await Promise.all([
                getAssignedComplaints({
                    page,
                    limit: 10,
                    ...(tab && { status: tab })
                }),
                getComplaintStats()
            ]);

            setComplaints(list.data || []);
            setPagination(list.pagination);
            setStats(statResult.data);
            setError("");
        } catch (err) {
            setError(apiError(err, "Unable to load assigned complaints."));
        } finally {
            setLoading(false);
        }
    }, [page, tab]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    const startWork = async (complaint) => {
        setBusyId(complaint._id);
        setError("");

        try {
            const result = await updateComplaintStatus(complaint._id, {
                status: "in_progress"
            });

            toast.success(result.message);
            setRefreshKey((k) => k + 1);
            await loadData();
        } catch (err) {
            setError(apiError(err, "Unable to update the complaint."));
        } finally {
            setBusyId("");
        }
    };

    const handleResolved = async (message) => {
        setResolveTarget(null);
        toast.success(message);
        setRefreshKey((k) => k + 1);
        await loadData();
    };

    const actionsFor = (complaint) => {
        if (complaint.status === "resolved") return null;

        return (
            <>
                {complaint.status !== "in_progress" && (
                    <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busyId === complaint._id}
                        onClick={() => startWork(complaint)}
                    >
                        Start work
                    </button>
                )}

                <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => setResolveTarget(complaint)}
                >
                    Resolve
                </button>
            </>
        );
    };

    return (
        <div className="legacy-page">

            <main className="page page">
                <header className="page-head">
                    <div>
                        <p className="eyebrow">STAFF PORTAL</p>
                        <h1>Assigned Complaints</h1>
                        <p className="muted">
                            Hello {user?.name}
                            {user?.department &&
                                ` · ${categoryLabel(user.department)} department`}
                            . Resolve complaints and attach an optional
                            proof image; the student is notified instantly.
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
                    <div className="tabs" role="tablist">
                        {TABS.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                role="tab"
                                aria-selected={tab === t.value}
                                className={`tab ${
                                    tab === t.value ? "active" : ""
                                }`}
                                onClick={() => {
                                    setTab(t.value);
                                    setPage(1);
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <ComplaintList
                            loading={loading}
                            complaints={complaints}
                            showStudent
                            emptyText="No complaints in this view."
                            onOpen={(id) => setParams({ open: id })}
                            renderActions={actionsFor}
                        />

                    <Pager pagination={pagination} onChange={setPage} />
                </section>
            </main>

            {openId && (
                <ComplaintDetailModal
                    complaintId={openId}
                    refreshKey={refreshKey}
                    onClose={() => setParams({}, { replace: true })}
                    renderActions={(c) => actionsFor(c)}
                />
            )}

            {resolveTarget && (
                <ResolveModal
                    complaint={resolveTarget}
                    onClose={() => setResolveTarget(null)}
                    onDone={handleResolved}
                />
            )}
        </div>
    );
};

export default StaffDashboard;
