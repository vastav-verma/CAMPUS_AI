import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState
} from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(1);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const push = useCallback(
        (type, message) => {
            if (!message) return;

            const id = nextId.current++;
            setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
            setTimeout(() => dismiss(id), 5000);
        },
        [dismiss]
    );

    const api = useMemo(
        () => ({
            success: (message) => push("success", message),
            error: (message) => push("error", message),
            info: (message) => push("info", message)
        }),
        [push]
    );

    return (
        <ToastContext.Provider value={api}>
            {children}

            <div className="toasts" aria-live="polite">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast toast-${toast.type}`}
                        role="status"
                    >
                        <span className="toast-icon" aria-hidden="true">
                            {toast.type === "success"
                                ? "✓"
                                : toast.type === "error"
                                  ? "!"
                                  : "i"}
                        </span>

                        <span className="toast-msg">{toast.message}</span>

                        <button
                            type="button"
                            className="toast-close"
                            onClick={() => dismiss(toast.id)}
                            aria-label="Dismiss"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used inside ToastProvider.");
    }

    return context;
};
