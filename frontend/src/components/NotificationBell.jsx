import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import useUnreadCount from "../hooks/useUnreadCount";
import { useAuth } from "../context/AuthContext";

import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead
} from "../services/notification.service";

import { complaintLinkFor, formatDateTime } from "../utils/constants";

const NotificationBell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { count, setCount, refresh } = useUnreadCount();

    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    const loadItems = async () => {
        setLoading(true);

        try {
            const result = await getNotifications({ limit: 8 });
            setItems(result.data || []);
            setCount(result.unreadCount ?? 0);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next) loadItems();
    };

    useEffect(() => {
        if (!open) return undefined;

        const onClick = (event) => {
            if (!wrapperRef.current?.contains(event.target)) {
                setOpen(false);
            }
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

    const handleOpenItem = async (item) => {
        setOpen(false);

        if (!item.isRead) {
            try {
                await markNotificationRead(item._id);
            } catch {
                // ignore
            }
            refresh();
        }

        navigate(complaintLinkFor(user?.role, item.complaintId));
    };

    const handleMarkAll = async () => {
        try {
            await markAllNotificationsRead();
            setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setCount(0);
        } catch {
            // ignore
        }
    };

    return (
        <div className="bell" ref={wrapperRef}>
            <button
                type="button"
                className="bell-btn"
                onClick={toggle}
                aria-label={`Notifications${
                    count ? `, ${count} unread` : ""
                }`}
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>

                {count > 0 && (
                    <span className="bell-count">
                        {count > 99 ? "99+" : count}
                    </span>
                )}
            </button>

            {open && (
                <div className="bell-panel">
                    <div className="bell-head">
                        <strong>Notifications</strong>

                        {count > 0 && (
                            <button
                                type="button"
                                className="link-btn"
                                onClick={handleMarkAll}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="bell-list">
                        {loading && (
                            <p className="muted pad">Loading...</p>
                        )}

                        {!loading && items.length === 0 && (
                            <p className="muted pad">
                                No notifications yet.
                            </p>
                        )}

                        {items.map((item) => (
                            <button
                                type="button"
                                key={item._id}
                                className={`bell-item ${
                                    item.isRead ? "" : "unread"
                                }`}
                                onClick={() => handleOpenItem(item)}
                            >
                                <strong>{item.title}</strong>
                                <span>{item.message}</span>
                                <small>{formatDateTime(item.createdAt)}</small>
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="bell-foot"
                        onClick={() => {
                            setOpen(false);
                            navigate("/notifications");
                        }}
                    >
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
