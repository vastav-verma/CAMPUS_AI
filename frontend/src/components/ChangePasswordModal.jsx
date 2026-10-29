import { useState } from "react";

import Modal from "./Modal";
import { useToast } from "../context/ToastContext";
import { changePassword } from "../services/auth.service";
import { apiError } from "../utils/constants";

const ChangePasswordModal = ({ onClose }) => {
    const toast = useToast();

    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirm: ""
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (form.newPassword !== form.confirm) {
            setError("New password and confirmation do not match.");
            return;
        }

        setSaving(true);

        try {
            await changePassword({
                currentPassword: form.currentPassword,
                newPassword: form.newPassword
            });

            toast.success("Password updated successfully.");
            onClose();
        } catch (err) {
            setError(apiError(err, "Unable to change password."));
            setSaving(false);
        }
    };

    return (
        <Modal title="Change password" onClose={onClose}>
            <form className="form" onSubmit={handleSubmit}>
                {error && (
                    <div className="alert alert-error">{error}</div>
                )}

                <label htmlFor="cp-current">Current password</label>
                <input
                    id="cp-current"
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={form.currentPassword}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="cp-new">New password</label>
                <input
                    id="cp-new"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="Min 8 characters, a letter and a number"
                    value={form.newPassword}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="cp-confirm">Confirm new password</label>
                <input
                    id="cp-confirm"
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={handleChange}
                    required
                />

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Update password"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ChangePasswordModal;
