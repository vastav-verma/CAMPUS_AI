import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import { login as loginUser } from "../services/auth.service";
import { getMyCollege } from "../services/workspace.service";

const AuthContext = createContext(null);

const readUser = () => {
    try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

// Applies a college's brand colour to the whole app.
const applyBrand = (color) => {
    const root = document.documentElement;

    if (color && /^#[0-9a-fA-F]{6}$/.test(color)) {
        root.style.setProperty("--brand", color);
    } else {
        root.style.removeProperty("--brand");
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(readUser);
    const [college, setCollege] = useState(null);

    const setSession = useCallback(({ token, user: sessionUser }) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(sessionUser));
        setUser(sessionUser);
    }, []);

    const login = useCallback(
        async (email, password, collegeCode) => {
            const result = await loginUser(email, password, collegeCode);
            const token = result?.data?.token || result?.token;
            const loggedIn = result?.data?.user || result?.user;

            if (token && loggedIn) setSession({ token, user: loggedIn });

            return result;
        },
        [setSession]
    );

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setCollege(null);
        applyBrand(null);
    }, []);

    const refreshCollege = useCallback(async () => {
        try {
            const result = await getMyCollege();
            setCollege(result.data);
            applyBrand(result.data?.primaryColor);
        } catch {
            // The 401 interceptor handles expired sessions.
        }
    }, []);

    useEffect(() => {
        if (user && user.role !== "super_admin") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            refreshCollege();
        }
    }, [user, refreshCollege]);

    const value = useMemo(
        () => ({
            user,
            college,
            login,
            logout,
            setSession,
            refreshCollege,
            isAuthenticated: Boolean(user)
        }),
        [user, college, login, logout, setSession, refreshCollege]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) throw new Error("useAuth must be used inside AuthProvider.");

    return context;
};
