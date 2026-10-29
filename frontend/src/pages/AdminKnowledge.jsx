import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import Icon from "../components/Icon";
import { ListSkeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";

import {
    getDocuments,
    uploadDocument,
    deleteDocument
} from "../services/document.service";

import { getBilling } from "../services/workspace.service";
import { apiError, formatDateTime } from "../utils/constants";

const STATUS_STYLE = {
    ready: "status-resolved",
    failed: "status-reopened",
    pending: "status-submitted",
    converting: "status-in_progress",
    chunking: "status-in_progress",
    embedding: "status-in_progress"
};

const ACCEPT = ".pdf,.txt,.md";

const AdminKnowledge = () => {
    const toast = useToast();
    const inputRef = useRef(null);

    const [docs, setDocs] = useState([]);
    const [billing, setBilling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState("");
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const [d, b] = await Promise.all([getDocuments(), getBilling()]);
            setDocs(d.data || []);
            setBilling(b.data);
        } catch (err) {
            setError(apiError(err, "Unable to load documents."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const pick = (selected) => {
        if (!selected) return;

        if (!/\.(pdf|txt|md)$/i.test(selected.name)) {
            setError("Only PDF, TXT or Markdown files are supported.");
            return;
        }

        setError("");
        setFile(selected);
        setTitle((prev) => prev || selected.name.replace(/\.[^.]+$/, ""));
    };

    const onDrop = (event) => {
        event.preventDefault();
        setDragging(false);
        pick(event.dataTransfer.files?.[0]);
    };

    const submit = async (event) => {
        event.preventDefault();

        if (!file || !title.trim()) return;

        setUploading(true);
        setError("");

        try {
            await uploadDocument(file, title.trim());
            toast.success("Document added to your knowledge base.");
            setFile(null);
            setTitle("");
            if (inputRef.current) inputRef.current.value = "";
            await load();
        } catch (err) {
            setError(apiError(err, "Upload failed."));
        } finally {
            setUploading(false);
        }
    };

    const remove = async (doc) => {
        if (!window.confirm(`Delete "${doc.title}"? The assistant will stop using it.`)) return;

        try {
            await deleteDocument(doc._id);
            toast.success("Document deleted.");
            await load();
        } catch (err) {
            toast.error(apiError(err, "Unable to delete the document."));
        }
    };

    const used = billing?.usage.documents ?? 0;
    const limit = billing?.limits.documents ?? 0;
    const full = billing && used >= limit;

    return (
        <main className="page">
            <header className="page-head">
                <div>
                    <h1>Knowledge base</h1>
                    <p className="muted">
                        Documents the AI assistant uses to answer student questions.
                    </p>
                </div>

                {billing && (
                    <div className="usage-pill">
                        {used} / {limit} documents
                    </div>
                )}
            </header>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <section className="card">
                <h2>Add a document</h2>

                {full ? (
                    <div className="alert alert-warn">
                        You've reached your plan's document limit.{" "}
                        <Link to="/admin/billing">View plans</Link>
                    </div>
                ) : (
                    <form onSubmit={submit} className="form">
                        <div
                            className={`dropzone ${dragging ? "drag" : ""} ${file ? "has-file" : ""}`}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                            onClick={() => inputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                        >
                            <Icon name={file ? "file" : "upload"} size={26} />
                            {file ? (
                                <>
                                    <strong>{file.name}</strong>
                                    <small>{(file.size / 1024 / 1024).toFixed(2)} MB · click to change</small>
                                </>
                            ) : (
                                <>
                                    <strong>Drag a file here, or click to browse</strong>
                                    <small>PDF, TXT or Markdown</small>
                                </>
                            )}

                            <input
                                ref={inputRef}
                                type="file"
                                accept={ACCEPT}
                                hidden
                                onChange={(e) => pick(e.target.files?.[0])}
                            />
                        </div>

                        <label htmlFor="doc-title">Title</label>
                        <input
                            id="doc-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Student Handbook 2026"
                            required
                        />

                        <div>
                            <button className="btn btn-primary" disabled={!file || uploading}>
                                {uploading ? "Processing (this can take a minute)..." : "Upload & process"}
                            </button>
                        </div>
                    </form>
                )}
            </section>

            <section className="card">
                <h2>Documents</h2>

                {loading ? (
                    <ListSkeleton rows={2} />
                ) : docs.length === 0 ? (
                    <p className="empty">
                        No documents yet. Upload your first one so the assistant can start answering.
                    </p>
                ) : (
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr><th>Title</th><th>File</th><th>Status</th><th>Added</th><th /></tr>
                            </thead>
                            <tbody>
                                {docs.map((doc) => (
                                    <tr key={doc._id}>
                                        <td><strong>{doc.title}</strong></td>
                                        <td className="muted">{doc.fileName || "-"}</td>
                                        <td>
                                            <span className={`badge ${STATUS_STYLE[doc.processingStatus] || ""}`} title={doc.processingError || ""}>
                                                {doc.processingStatus}
                                            </span>
                                        </td>
                                        <td className="muted">{formatDateTime(doc.createdAt)}</td>
                                        <td>
                                            <button className="icon-btn" aria-label={`Delete ${doc.title}`} onClick={() => remove(doc)}>
                                                <Icon name="trash" size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
};

export default AdminKnowledge;
