import { useEffect, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import ChangePasswordModal from "./ChangePasswordModal";

const ROLE_LABEL = {
    super_admin: "Super Admin",
    college_admin: "Administrator",
    staff: "Staff",
    student: "Student"
};

const initials = (name = "") =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("") || "U";

const UserMenu = () => {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        const onClick = (event) => {
            if (!ref.current?.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div className="usermenu" ref={ref}>
            <button
                type="button"
                className="user-btn"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <span className="avatar">{initials(user?.name)}</span>

                <span className="user-text">
                    <strong>{user?.name || "User"}</strong>
                    <small>{ROLE_LABEL[user?.role] || "User"}</small>
                </span>
            </button>

            {open && (
                <div className="menu" role="menu">
                    <div className="menu-head">
                        <strong>{user?.name}</strong>
                        <span>{user?.email}</span>
                    </div>

                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setOpen(false);
                            setShowPassword(true);
                        }}
                    >
                        Change password
                    </button>

                    <button
                        type="button"
                        role="menuitem"
                        className="menu-danger"
                        onClick={logout}
                    >
                        Log out
                    </button>
                </div>
            )}

            {showPassword && (
                <ChangePasswordModal onClose={() => setShowPassword(false)} />
            )}
        </div>
    );
};

export default UserMenu;
