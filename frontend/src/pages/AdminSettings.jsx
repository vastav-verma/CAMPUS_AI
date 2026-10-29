import { useEffect, useState } from "react";

import Icon from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { updateCollege } from "../services/workspace.service";
import { apiError } from "../utils/constants";

const SWATCHES = ["#4f46e5", "#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626", "#9333ea", "#0f172a"];

const AdminSettings = () => {
    const { college, refreshCollege } = useAuth();
    const toast = useToast();

    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (college && !form) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setForm({
                name: college.name,
                chatbotName: college.chatbotName || "",
                welcomeMessage: college.welcomeMessage || "",
                primaryColor: college.primaryColor || "#4f46e5",
                supportEmail: college.supportEmail || "",
                openRegistration: college.openRegistration
            });
        }
    }, [college, form]);

    if (!form) return <main className="page"><p className="muted">Loading settings...</p></main>;

    const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            await updateCollege(form);
            await refreshCollege();
            toast.success("Settings saved.");
        } catch (err) {
            setError(apiError(err, "Unable to save settings."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="page">
            <header className="page-head">
                <div>
                    <h1>Settings</h1>
                    <p className="muted">Make the assistant feel like your own.</p>
                </div>
            </header>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <div className="settings-grid">
                <form className="card form" onSubmit={save}>
                    <h2>Workspace</h2>

                    <label htmlFor="st-name">College name</label>
                    <input id="st-name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={120} required />

                    <label htmlFor="st-bot">Assistant name</label>
                    <input id="st-bot" value={form.chatbotName} onChange={(e) => set("chatbotName", e.target.value)} maxLength={60} required />

                    <label htmlFor="st-welcome">Welcome message</label>
                    <input id="st-welcome" value={form.welcomeMessage} onChange={(e) => set("welcomeMessage", e.target.value)} maxLength={200} />

                    <label>Brand colour</label>
                    <div className="swatches">
                        {SWATCHES.map((color) => (
                            <button
                                type="button"
                                key={color}
                                className={`swatch ${form.primaryColor === color ? "on" : ""}`}
                                style={{ background: color }}
                                onClick={() => set("primaryColor", color)}
                                aria-label={`Use ${color}`}
                            />
                        ))}
                        <input type="color" value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} aria-label="Custom colour" />
                    </div>

                    <label htmlFor="st-email">Support email (optional)</label>
                    <input id="st-email" type="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />

                    <label className="check">
                        <input type="checkbox" checked={form.openRegistration} onChange={(e) => set("openRegistration", e.target.checked)} />
                        <span>
                            <strong>Allow self-registration with the college code</strong>
                            <small>Off (recommended): people can only join through invite links or CSV import.</small>
                        </span>
                    </label>

                    <div><button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div>
                </form>

                <aside className="card preview" style={{ "--brand": form.primaryColor }}>
                    <h2>Preview</h2>

                    <div className="preview-chat">
                        <div className="preview-head">
                            <span className="bot-avatar"><Icon name="sparkle" size={15} /></span>
                            <strong>{form.chatbotName || "Assistant"}</strong>
                        </div>
                        <div className="preview-body">
                            <div className="bubble">{form.welcomeMessage || "How can I help you?"}</div>
                            <div className="bubble bubble-user-preview">What are the exam dates?</div>
                        </div>
                        <button type="button" className="btn btn-primary btn-block" tabIndex={-1}>Primary button</button>
                    </div>
                </aside>
            </div>
        </main>
    );
};

export default AdminSettings;
