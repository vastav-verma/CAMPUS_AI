import { useEffect } from "react";

const Modal = ({ title, onClose, children, wide = false }) => {
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    return (
        <div
            className="overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                className={`modal ${wide ? "modal-wide" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div className="modal-head">
                    <h2>{title}</h2>

                    <button
                        type="button"
                        className="icon-btn"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
