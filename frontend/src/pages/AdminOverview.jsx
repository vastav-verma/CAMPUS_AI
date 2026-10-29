import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import StatsRow from "../components/StatsRow";
import { BlockSkeleton } from "../components/Skeleton";
import { DonutChart, HBarList, TrendChart } from "../components/Charts";

import { useAuth } from "../context/AuthContext";

import {
    getComplaintAnalytics,
    getComplaintStats
} from "../services/complaint.service";

import { getBilling } from "../services/workspace.service";

import {
    apiError,
    categoryLabel,
    severityLabel
} from "../utils/constants";

const STATUS_COLORS = [
    { key: "submitted", label: "Unassigned", color: "#f59e0b" },
    { key: "assigned", label: "Assigned", color: "#2563eb" },
    { key: "in_progress", label: "In progress", color: "#7c3aed" },
    { key: "reopened", label: "Reopened", color: "#dc2626" },
    { key: "resolved", label: "Resolved", color: "#16a34a" }
];

const SEVERITY_COLORS = {
    low: "#94a3b8",
    medium: "#38bdf8",
    high: "#f97316",
    critical: "#dc2626"
};

const STAT_ITEMS = [
    { key: "total", label: "Total complaints" },
    { key: "submitted", label: "Need assignment" },
    { key: "in_progress", label: "In progress" },
    { key: "resolved", label: "Resolved" }
];

const formatHours = (hours) => {
    if (hours === null || hours === undefined) return "—";
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 48) return `${hours} hrs`;
    return `${Math.round((hours / 24) * 10) / 10} days`;
};

const AdminOverview = () => {
    const { user, college } = useAuth();
    const [params] = useSearchParams();
    const [billing, setBilling] = useState(null);

    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getBilling()
            .then((r) => setBilling(r.data))
            .catch(() => {});
    }, []);

    const checklist = billing
        ? [
              { done: billing.usage.documents > 0, label: "Upload your first document", hint: "So the AI can answer student questions", to: "/admin/knowledge" },
              { done: billing.usage.staff > 0, label: "Add complaint-handling staff", hint: "Invite by link or add them directly", to: "/admin/people" },
              { done: billing.usage.students > 0, label: "Invite your students", hint: "Share one link or import a CSV", to: "/admin/people" },
              { done: false, label: "Personalise the assistant", hint: "Name, colour and welcome message", to: "/admin/settings", optional: true }
          ]
        : [];

    const requiredDone = checklist.filter((c) => !c.optional && c.done).length;
    const requiredTotal = checklist.filter((c) => !c.optional).length;

    useEffect(() => {
        Promise.all([getComplaintStats(), getComplaintAnalytics(14)])
            .then(([statResult, analyticsResult]) => {
                setStats(statResult.data);
                setAnalytics(analyticsResult.data);
            })
            .catch((err) =>
                setError(apiError(err, "Unable to load the overview."))
            );
    }, []);

    const resolutionRate =
        stats && stats.total > 0
            ? Math.round((stats.resolved / stats.total) * 100)
            : 0;

    return (
        <div className="legacy-page">

            <main className="page page">
                <header className="page-head">
                    <div>
                        <p className="eyebrow">ADMINISTRATION</p>
                        <h1>Welcome back, {user?.name?.split(" ")[0]}</h1>
                        <p className="muted">
                            A live picture of complaints across your college.
                        </p>
                    </div>

                    <Link to="/admin/complaints" className="btn btn-outline">
                        Manage complaints
                    </Link>
                </header>

                {params.get("welcome") && (
                    <div className="alert alert-success">
                        🎉 Welcome to CampusAI! Your workspace <strong>{college?.name}</strong> is ready.
                        College code: <strong>{college?.collegeCode}</strong>
                    </div>
                )}

                {checklist.length > 0 && requiredDone < requiredTotal && (
                    <section className="card onboarding">
                        <div className="card-head">
                            <h2>Get started</h2>
                            <span className="muted">{requiredDone} of {requiredTotal} done</span>
                        </div>
                        <div className="hbar-track" style={{ marginBottom: 14 }}>
                            <div className="hbar-fill" style={{ width: `${(requiredDone / requiredTotal) * 100}%`, background: "#16a34a" }} />
                        </div>
                        <ul className="checklist">
                            {checklist.map((item) => (
                                <li key={item.label} className={item.done ? "done" : ""}>
                                    <span className="check-dot">{item.done ? "✓" : ""}</span>
                                    <div>
                                        <strong>{item.label}</strong>
                                        <small>{item.hint}</small>
                                    </div>
                                    {!item.done && <Link className="btn btn-outline" to={item.to}>Start</Link>}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                    </div>
                )}

                {stats?.submitted > 0 && (
                    <div className="callout">
                        <div>
                            <strong>
                                {stats.submitted} complaint
                                {stats.submitted > 1 ? "s are" : " is"} waiting
                                for assignment
                            </strong>
                            <span>
                                No matching staff was available. Assign them so
                                students are not left waiting.
                            </span>
                        </div>

                        <Link
                            to="/admin/complaints"
                            className="btn btn-primary"
                        >
                            Assign now
                        </Link>
                    </div>
                )}

                <StatsRow stats={stats} items={STAT_ITEMS} />

                {!analytics ? (
                    <div className="grid-charts">
                        <BlockSkeleton height={260} />
                        <BlockSkeleton height={260} />
                    </div>
                ) : (
                    <>
                        <div className="kpis">
                            <div className="kpi">
                                <span>Resolution rate</span>
                                <strong>{resolutionRate}%</strong>
                                <div className="hbar-track">
                                    <div
                                        className="hbar-fill"
                                        style={{
                                            width: `${resolutionRate}%`,
                                            background: "#16a34a"
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="kpi">
                                <span>Avg. time to resolve</span>
                                <strong>
                                    {formatHours(analytics.avgResolutionHours)}
                                </strong>
                                <small>From submission to resolution</small>
                            </div>

                            <div className="kpi">
                                <span>Reopened</span>
                                <strong>{stats?.reopened ?? 0}</strong>
                                <small>Students not satisfied</small>
                            </div>
                        </div>

                        <div className="grid-charts">
                            <section className="card">
                                <h2>Status breakdown</h2>
                                <DonutChart
                                    data={STATUS_COLORS.map((s) => ({
                                        label: s.label,
                                        color: s.color,
                                        value: stats?.[s.key] ?? 0
                                    }))}
                                />
                            </section>

                            <section className="card">
                                <h2>Last 14 days</h2>
                                <TrendChart data={analytics.trend} />
                            </section>

                            <section className="card">
                                <h2>By category</h2>
                                <HBarList
                                    items={analytics.byCategory.map((c) => ({
                                        label: categoryLabel(c.category),
                                        value: c.count
                                    }))}
                                />
                            </section>

                            <section className="card">
                                <h2>By priority</h2>
                                <HBarList
                                    items={analytics.bySeverity.map((s) => ({
                                        label: severityLabel(s.severity),
                                        value: s.count,
                                        color: SEVERITY_COLORS[s.severity]
                                    }))}
                                />
                            </section>
                        </div>

                        <section className="card">
                            <h2>Top resolvers</h2>

                            {analytics.topStaff.length === 0 ? (
                                <p className="empty">
                                    Nothing resolved yet.
                                </p>
                            ) : (
                                <HBarList
                                    color="#16a34a"
                                    items={analytics.topStaff.map((s) => ({
                                        label: `${s.name}${
                                            s.department
                                                ? ` · ${categoryLabel(s.department)}`
                                                : ""
                                        }`,
                                        value: s.resolved
                                    }))}
                                />
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminOverview;
