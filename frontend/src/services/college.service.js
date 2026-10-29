import api from "./api";

export const getColleges = async () => (await api.get("/colleges")).data;

export const createCollege = async (payload) =>
    (await api.post("/colleges", payload)).data;

export const setCollegeActive = async (id, isActive) =>
    (
        await api.patch(`/colleges/${encodeURIComponent(id)}/active`, {
            isActive
        })
    ).data;

export const setCollegePlan = async (id, tier) =>
    (await api.patch(`/colleges/${encodeURIComponent(id)}/plan`, { tier })).data;
