import { useEffect, useState } from "react";

import Modal from "./Modal";
import { updateComplaintStatus } from "../services/complaint.service";

import {
    apiError,
    MAX_PROOF_SIZE,
    PROOF_TYPES
} from "../utils/constants";

const ResolveModal = ({ complaint, onClose, onDone }) => {
    const [remarks, setRemarks] = useState("");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!file) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPreview("");
            return undefined;
        }

        const url = URL.createObjectURL(file);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleFile = (event) => {
        const selected = event.target.files?.[0];

        setError("");

        if (!selected) {
            setFile(null);
            return;
        }

        if (!PROOF_TYPES.includes(selected.type)) {
            setError("Please choose a JPG, PNG or WEBP image.");
            event.target.value = "";
            return;
        }

        if (selected.size > MAX_PROOF_SIZE) {
            setError("Image must be smaller than 5 MB.");
            event.target.value = "";
            return;
        }

        setFile(selected);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!remarks.trim()) {
            setError("Please describe how the problem was resolved.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const result = await updateComplaintStatus(complaint._id, {
                status: "resolved",
                remarks: remarks.trim(),
                proof: file
            });

            onDone(result.message);
        } catch (err) {
            setError(apiError(err, "Unable to resolve the complaint."));
            setSaving(false);
        }
    };

    return (
        <Modal title="Mark as resolved" onClose={onClose}>
            <form className="form" onSubmit={handleSubmit}>
                <p className="muted">
                    <strong>{complaint.title}</strong>
                    <br />
                    The student will be notified as soon as you submit.
                </p>

                {error && (
                    <div className="alert alert-error">{error}</div>
                )}

                <label htmlFor="resolve-remarks">
                    Resolution remarks *
                </label>
                <textarea
                    id="resolve-remarks"
                    rows={4}
                    maxLength={2000}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="What was done to fix the issue?"
                    required
                />

                <label htmlFor="resolve-proof">
                    Proof image (optional)
                </label>
                <input
                    id="resolve-proof"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFile}
                />

                {preview && (
                    <img
                        className="proof"
                        src={preview}
                        alt="Selected proof preview"
                    />
                )}

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="btn btn-success"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Mark as resolved"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ResolveModal;
