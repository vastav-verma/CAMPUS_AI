import api from "./api";

export const getNotifications = async (params = {}) =>
    (await api.get("/notifications", { params })).data;

export const getUnreadCount = async () =>
    (await api.get("/notifications/unread-count")).data;

export const markNotificationRead = async (id) =>
    (await api.patch(`/notifications/${encodeURIComponent(id)}/read`))
        .data;

export const markAllNotificationsRead = async () =>
    (await api.patch("/notifications/read-all")).data;
