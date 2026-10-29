import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Pager from "../components/Pager";

import { useAuth } from "../context/AuthContext";

import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead
} from "../services/notification.service";

import {
    apiError,
    complaintLinkFor,
    formatDateTime
} from "../utils/constants";

const Notifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [unread, setUnread] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const result = await getNotifications({ page, limit: 15 });
            setItems(result.data || []);
            setPagination(result.pagination);
            setUnread(result.unreadCount ?? 0);
            setError("");
        } catch (err) {
            setError(apiError(err, "Unable to load notifications."));
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const openItem = async (item) => {
        if (!item.isRead) {
            try {
                await markNotificationRead(item._id);
            } catch {
                // ignore
            }
        }

        navigate(complaintLinkFor(user?.role, item.complaintId));
    };

    const markAll = async () => {
        try {
            await markAllNotificationsRead();
            await load();
        } catch (err) {
            setError(apiError(err, "Unable to update notifications."));
        }
    };

    return (
        <div className="legacy-page">

            <main className="page page">
                <header className="page-head">
                    <div>
                        <p className="eyebrow">INBOX</p>
                        <h1>Notifications</h1>
                        <p className="muted">{unread} unread</p>
                    </div>

                    {unread > 0 && (
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={markAll}
                        >
                            Mark all as read
                        </button>
                    )}
                </header>

                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                    </div>
                )}

                <section className="card">
                    {loading ? (
                        <p className="muted">Loading...</p>
                    ) : items.length === 0 ? (
                        <p className="empty">No notifications yet.</p>
                    ) : (
                        <div className="list">
                            {items.map((item) => (
                                <button
                                    type="button"
                                    key={item._id}
                                    className={`notif ${
                                        item.isRead ? "" : "unread"
                                    }`}
                                    onClick={() => openItem(item)}
                                >
                                    <strong>{item.title}</strong>
                                    <span>{item.message}</span>
                                    <small>
                                        {formatDateTime(item.createdAt)}
                                    </small>
                                </button>
                            ))}
                        </div>
                    )}

                    <Pager pagination={pagination} onChange={setPage} />
                </section>
            </main>
        </div>
    );
};

export default Notifications;
