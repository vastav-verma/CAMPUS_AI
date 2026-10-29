import api from "./api";

export const signupCollege = async (payload) =>
    (await api.post("/public/signup", payload)).data;

export const checkCodeAvailable = async (code) =>
    (await api.get(`/public/college-code/${encodeURIComponent(code)}`)).data;

export const suggestCollegeCode = async (name) =>
    (await api.get("/public/college-code/suggest", { params: { name } })).data;

export const getCollegeBranding = async (code) =>
    (await api.get(`/public/colleges/${encodeURIComponent(code)}`)).data;

export const getInvite = async (token) =>
    (await api.get(`/public/invites/${encodeURIComponent(token)}`)).data;

export const acceptInvite = async (token, payload) =>
    (await api.post(`/public/invites/${encodeURIComponent(token)}/accept`, payload)).data;
