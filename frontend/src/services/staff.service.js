import api from "./api";

export const getStaff = async (params = {}) =>
    (await api.get("/staff", { params })).data;

export const createStaff = async (payload) =>
    (await api.post("/staff", payload)).data;

export const setStaffActive = async (id, isActive) =>
    (
        await api.patch(`/staff/${encodeURIComponent(id)}/active`, {
            isActive
        })
    ).data;
