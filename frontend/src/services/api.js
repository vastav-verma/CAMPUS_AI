import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// ==========================================
// ATTACH JWT TOKEN
// ==========================================

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ==========================================
// EXPIRED / INVALID SESSION => back to login
// ==========================================

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthCall = error.config?.url?.startsWith("/auth/login");

        if (
            error.response?.status === 401 &&
            !isAuthCall &&
            localStorage.getItem("token")
        ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.assign("/login");
        }

        return Promise.reject(error);
    }
);

export default api;
