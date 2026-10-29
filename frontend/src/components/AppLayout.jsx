import { useEffect, useState } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";

import Icon from "./Icon";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";

import { useAuth } from "../context/AuthContext";
import { getBilling } from "../services/workspace.service";

const NAV = {
    student: [
        { to: "/chat", label: "AI Assistant", icon: "chat" },
        { to: "/complaints", label: "My Complaints", icon: "ticket" }
    ],
    staff: [
        { to: "/staff", label: "Assigned Complaints", icon: "ticket" },
        { to: "/chat", label: "AI Assistant", icon: "chat" }
    ],
    college_admin: [
        { to: "/admin", label: "Overview", icon: "dashboard", end: true },
        { to: "/admin/complaints", label: "Complaints", icon: "ticket" },
        { to: "/admin/people", label: "People", icon: "users" },
        { to: "/admin/knowledge", label: "Knowledge base", icon: "book" },
        { to: "/chat", label: "AI Assistant", icon: "chat" },
        { to: "/admin/settings", label: "Settings", icon: "settings" },
        { to: "/admin/billing", label: "Plan & billing", icon: "card" }
    ],
    super_admin: [{ to: "/super-admin", label: "Colleges", icon: "building" }]
};

const AppLayout = () => {
    const { user, college } = useAuth();
    const [open, setOpen] = useState(false);
    const [trialDays, setTrialDays] = useState(null);

    useEffect(() => {
        if (user?.role !== "college_admin") return;

        getBilling()
            .then((result) => setTrialDays(result.data.trialDaysLeft))
            .catch(() => {});
    }, [user?.role]);

    const links = NAV[user?.role] || [];

    return (
        <div className="shell">
            {open && (
                <div className="shell-scrim" onClick={() => setOpen(false)} />
            )}

            <aside className={`sidebar ${open ? "open" : ""}`}>
                <div className="sidebar-top">
                    <Logo />
                </div>

                <div className="workspace-chip">
                    <span className="workspace-avatar">
                        {(college?.name || "Platform")[0]}
                    </span>
                    <div>
                        <strong>
                            {user?.role === "super_admin"
                                ? "Platform"
                                : college?.name || "Loading..."}
                        </strong>
                        <small>
                            {user?.role === "super_admin"
                                ? "Super admin"
                                : `Code: ${college?.collegeCode || "..."}`}
                        </small>
                    </div>
                </div>

                <nav className="side-nav" aria-label="Main navigation">
                    {links.map((link) => (
                        <NavLink
                            key={link.to + link.label}
                            to={link.to}
                            end={link.end}
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                                `side-link ${isActive ? "active" : ""}`
                            }
                        >
                            <Icon name={link.icon} />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                {user?.role === "college_admin" && trialDays !== null && (
                    <Link to="/admin/billing" className="trial-card">
                        <strong>
                            {trialDays > 0
                                ? `${trialDays} days left in trial`
                                : "Trial ended"}
                        </strong>
                        <span>See plans &rarr;</span>
                    </Link>
                )}
            </aside>

            <div className="shell-main">
                <header className="topbar">
                    <button
                        type="button"
                        className="topbar-menu"
                        onClick={() => setOpen(true)}
                        aria-label="Open menu"
                    >
                        <Icon name="menu" size={20} />
                    </button>

                    <div className="topbar-title">
                        {college?.name || ""}
                    </div>

                    <div className="topbar-right">
                        {user?.role !== "super_admin" && <NotificationBell />}
                        <UserMenu />
                    </div>
                </header>

                <div className="shell-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AppLayout;
