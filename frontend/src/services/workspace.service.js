import api from "./api";

export const getMyCollege = async () => (await api.get("/workspace/college")).data;

export const updateCollege = async (payload) =>
    (await api.patch("/workspace/college", payload)).data;

export const getBilling = async () => (await api.get("/workspace/billing")).data;

export const getInvites = async () => (await api.get("/workspace/invites")).data;

export const createInvite = async (payload) =>
    (await api.post("/workspace/invites", payload)).data;

export const revokeInvite = async (id) =>
    (await api.delete(`/workspace/invites/${encodeURIComponent(id)}`)).data;

export const getUsers = async (params = {}) =>
    (await api.get("/workspace/users", { params })).data;

export const setUserActive = async (id, isActive) =>
    (await api.patch(`/workspace/users/${encodeURIComponent(id)}/active`, { isActive })).data;

export const importUsers = async (rows) =>
    (await api.post("/workspace/users/import", { rows })).data;
