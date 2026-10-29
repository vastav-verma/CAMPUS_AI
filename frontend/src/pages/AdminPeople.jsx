import { useCallback, useEffect, useRef, useState } from "react";

import Icon from "../components/Icon";
import Modal from "../components/Modal";
import Pager from "../components/Pager";
import { ListSkeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";

import {
    getUsers,
    setUserActive,
    getInvites,
    createInvite,
    revokeInvite,
    importUsers
} from "../services/workspace.service";

import { createStaff } from "../services/staff.service";
import { parseCSVObjects, toCSV, downloadText } from "../utils/csv";

import {
    CATEGORIES,
    apiError,
    categoryLabel,
    formatDateTime
} from "../utils/constants";

const inviteUrl = (token) => `${window.location.origin}/join/${token}`;

const TEMPLATE = toCSV([
    ["name", "email", "role", "department"],
    ["Riya Sharma", "riya@college.edu", "student", ""],
    ["Amit Verma", "amit@college.edu", "staff", "hostel"]
]);

/* ---------------------------------------------------------------
   Invite link modal
--------------------------------------------------------------- */
const InviteModal = ({ onClose }) => {
    const toast = useToast();

    const [form, setForm] = useState({ role: "student", department: "academics", expiresInDays: 14, maxUses: 100 });
    const [invites, setInvites] = useState([]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const result = await getInvites();
            setInvites(result.data || []);
        } catch {
            setInvites([]);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const copy = async (token) => {
        try {
            await navigator.clipboard.writeText(inviteUrl(token));
            toast.success("Invite link copied.");
        } catch {
            toast.error("Copy failed. Select the link and copy it manually.");
        }
    };

    const create = async (event) => {
        event.preventDefault();
        setCreating(true);
        setError("");

        try {
            const result = await createInvite({
                ...form,
                expiresInDays: Number(form.expiresInDays),
                maxUses: Number(form.maxUses)
            });

            await copy(result.data.token);
            await load();
        } catch (err) {
            setError(apiError(err, "Unable to create the invite."));
        } finally {
            setCreating(false);
        }
    };

    const revoke = async (id) => {
        try {
            await revokeInvite(id);
            await load();
        } catch (err) {
            toast.error(apiError(err, "Unable to revoke the invite."));
        }
    };

    const active = invites.filter((i) => i.isActive && new Date(i.expiresAt) > new Date() && i.uses < i.maxUses);

    return (
        <Modal title="Invite people with a link" onClose={onClose} wide>
            <form className="form" onSubmit={create}>
                {error && <div className="alert alert-error">{error}</div>}

                <div className="grid-2">
                    <div>
                        <label htmlFor="iv-role">Invite as</label>
                        <select id="iv-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                            <option value="student">Students</option>
                            <option value="staff">Staff (complaint handlers)</option>
                        </select>
                    </div>

                    {form.role === "staff" && (
                        <div>
                            <label htmlFor="iv-dept">Department</label>
                            <select id="iv-dept" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    )}

                    <div>
                        <label htmlFor="iv-days">Expires in (days)</label>
                        <input id="iv-days" type="number" min="1" max="90" value={form.expiresInDays} onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })} />
                    </div>

                    <div>
                        <label htmlFor="iv-uses">Max people</label>
                        <input id="iv-uses" type="number" min="1" max="5000" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
                    </div>
                </div>

                <div><button className="btn btn-primary" disabled={creating}>
                    <Icon name="link" size={16} /> {creating ? "Creating..." : "Create & copy link"}
                </button></div>
            </form>

            <h4 className="form-section">Active links</h4>

            {active.length === 0 ? (
                <p className="muted small">No active links yet.</p>
            ) : (
                <ul className="invite-list">
                    {active.map((invite) => (
                        <li key={invite._id}>
                            <div className="invite-info">
                                <strong>
                                    {invite.role === "staff" ? `Staff · ${categoryLabel(invite.department)}` : "Students"}
                                </strong>
                                <small>
                                    {invite.uses}/{invite.maxUses} used · expires {formatDateTime(invite.expiresAt)}
                                </small>
                                <code>{inviteUrl(invite.token)}</code>
                            </div>

                            <div className="invite-actions">
                                <button className="btn btn-outline" onClick={() => copy(invite.token)}>
                                    <Icon name="copy" size={14} /> Copy
                                </button>
                                <button className="btn btn-outline" onClick={() => revoke(invite._id)}>Revoke</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
};

/* ---------------------------------------------------------------
   CSV import modal
--------------------------------------------------------------- */
const ImportModal = ({ onClose, onDone }) => {
    const fileRef = useRef(null);

    const [rows, setRows] = useState([]);
    const [fileName, setFileName] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const onFile = async (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        setError("");
        setFileName(file.name);

        try {
            const parsed = parseCSVObjects(await file.text());

            if (parsed.length === 0) throw new Error("The file has no rows.");
            if (!("email" in parsed[0]) || !("name" in parsed[0])) {
                throw new Error('The first row must include "name" and "email" columns.');
            }

            setRows(parsed);
        } catch (err) {
            setRows([]);
            setError(err.message || "Unable to read that file.");
        }
    };

    const runImport = async () => {
        setBusy(true);
        setError("");

        try {
            const response = await importUsers(rows);
            setResult(response.data);
            onDone();
        } catch (err) {
            setError(apiError(err, "Import failed."));
        } finally {
            setBusy(false);
        }
    };

    const downloadCredentials = () => {
        const csv = toCSV([
            ["name", "email", "role", "department", "temporary_password"],
            ...result.created.map((c) => [c.name, c.email, c.role, c.department || "", c.password])
        ]);
        downloadText("new-accounts.csv", csv);
    };

    return (
        <Modal title="Import people from CSV" onClose={onClose} wide>
            {error && <div className="alert alert-error">{error}</div>}

            {!result ? (
                <div className="form">
                    <p className="muted">
                        Upload a CSV with columns <code>name, email, role, department</code>. Role is
                        <code> student</code> (default) or <code>staff</code>; staff need a department.
                        Up to 100 people at a time. Temporary passwords are generated for you.
                    </p>

                    <div>
                        <button type="button" className="btn btn-outline" onClick={() => downloadText("people-template.csv", TEMPLATE)}>
                            <Icon name="download" size={15} /> Download template
                        </button>
                    </div>

                    <div className="dropzone" role="button" tabIndex={0} onClick={() => fileRef.current?.click()}
                        onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}>
                        <Icon name="upload" size={26} />
                        <strong>{fileName || "Choose a CSV file"}</strong>
                        {rows.length > 0 && <small>{rows.length} rows ready to import</small>}
                        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} />
                    </div>

                    {rows.length > 0 && (
                        <div className="table-wrap" style={{ maxHeight: 200 }}>
                            <table className="table">
                                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th></tr></thead>
                                <tbody>
                                    {rows.slice(0, 5).map((r, i) => (
                                        <tr key={i}><td>{r.name}</td><td>{r.email}</td><td>{r.role || "student"}</td><td>{r.department}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                            {rows.length > 5 && <p className="muted small">…and {rows.length - 5} more</p>}
                        </div>
                    )}

                    <div className="modal-footer">
                        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" disabled={!rows.length || busy} onClick={runImport}>
                            {busy ? "Importing..." : `Import ${rows.length || ""} people`}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="form">
                    <div className="alert alert-success">
                        <strong>{result.created.length}</strong> account(s) created
                        {result.skipped.length > 0 && <>, <strong>{result.skipped.length}</strong> skipped</>}.
                    </div>

                    {result.created.length > 0 && (
                        <>
                            <p className="muted">
                                Download the credentials now. Passwords are shown only once. Ask everyone to
                                change theirs after the first login.
                            </p>
                            <div><button className="btn btn-primary" onClick={downloadCredentials}>
                                <Icon name="download" size={15} /> Download credentials (CSV)
                            </button></div>
                        </>
                    )}

                    {result.skipped.length > 0 && (
                        <>
                            <h4 className="form-section">Skipped</h4>
                            <ul className="skip-list">
                                {result.skipped.map((s, i) => (
                                    <li key={i}>{s.line ? `Row ${s.line}` : "Row"} · {s.email || "(no email)"} — {s.reason}</li>
                                ))}
                            </ul>
                        </>
                    )}

                    <div className="modal-footer"><button className="btn btn-primary" onClick={onClose}>Done</button></div>
                </div>
            )}
        </Modal>
    );
};

/* ---------------------------------------------------------------
   Add single staff
--------------------------------------------------------------- */
const StaffModal = ({ onClose, onDone }) => {
    const toast = useToast();

    const [form, setForm] = useState({ name: "", email: "", password: "", department: "academics" });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            await createStaff({ ...form, name: form.name.trim(), email: form.email.trim() });
            toast.success("Staff member created.");
            onDone();
            onClose();
        } catch (err) {
            setError(apiError(err, "Unable to create staff member."));
            setSaving(false);
        }
    };

    return (
        <Modal title="Add a staff member" onClose={onClose}>
            <form className="form" onSubmit={submit}>
                {error && <div className="alert alert-error">{error}</div>}

                <label htmlFor="sf-name">Full name</label>
                <input id="sf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

                <label htmlFor="sf-email">Email</label>
                <input id="sf-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />

                <label htmlFor="sf-pass">Temporary password</label>
                <input id="sf-pass" type="password" minLength={8} autoComplete="new-password" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 chars, letter + number" required />

                <label htmlFor="sf-dept">Department</label>
                <select id="sf-dept" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>

                <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" disabled={saving}>{saving ? "Creating..." : "Create staff"}</button>
                </div>
            </form>
        </Modal>
    );
};

/* ---------------------------------------------------------------
   Page
--------------------------------------------------------------- */
const AdminPeople = () => {
    const toast = useToast();

    const [tab, setTab] = useState("student");
    const [q, setQ] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);

    const load = useCallback(async () => {
        try {
            const result = await getUsers({ role: tab, q: query, page, limit: 15 });
            setUsers(result.data || []);
            setPagination(result.pagination);
        } catch (err) {
            toast.error(apiError(err, "Unable to load people."));
        } finally {
            setLoading(false);
        }
    }, [tab, query, page, toast]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const toggle = async (user) => {
        try {
            await setUserActive(user._id, !user.isActive);
            await load();
        } catch (err) {
            toast.error(apiError(err, "Unable to update the account."));
        }
    };

    return (
        <main className="page">
            <header className="page-head">
                <div>
                    <h1>People</h1>
                    <p className="muted">Add students and staff in seconds: share a link or import a spreadsheet.</p>
                </div>

                <div className="head-actions">
                    <button className="btn btn-outline" onClick={() => setModal("import")}>
                        <Icon name="upload" size={16} /> Import CSV
                    </button>
                    <button className="btn btn-outline" onClick={() => setModal("staff")}>
                        <Icon name="plus" size={16} /> Add staff
                    </button>
                    <button className="btn btn-primary" onClick={() => setModal("invite")}>
                        <Icon name="link" size={16} /> Invite link
                    </button>
                </div>
            </header>

            <section className="card">
                <div className="card-head">
                    <div className="tabs" role="tablist">
                        {["student", "staff"].map((role) => (
                            <button
                                key={role}
                                role="tab"
                                aria-selected={tab === role}
                                className={`tab ${tab === role ? "active" : ""}`}
                                onClick={() => { setTab(role); setPage(1); setLoading(true); }}
                            >
                                {role === "student" ? "Students" : "Staff"}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); setPage(1); }}>
                        <input type="search" className="search" placeholder="Search name or email..." value={q} onChange={(e) => setQ(e.target.value)} />
                    </form>
                </div>

                {loading ? (
                    <ListSkeleton rows={3} />
                ) : users.length === 0 ? (
                    <div className="empty">
                        <p>No {tab === "student" ? "students" : "staff"} yet.</p>
                        <button className="btn btn-primary" onClick={() => setModal("invite")}>
                            Create an invite link
                        </button>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th><th>Email</th>
                                    {tab === "staff" && <th>Department</th>}
                                    <th>Joined</th><th>Status</th><th />
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id}>
                                        <td><strong>{u.name}</strong></td>
                                        <td className="muted">{u.email}</td>
                                        {tab === "staff" && <td>{categoryLabel(u.department)}</td>}
                                        <td className="muted">{formatDateTime(u.createdAt)}</td>
                                        <td>
                                            <span className={`badge ${u.isActive ? "status-resolved" : "status-reopened"}`}>
                                                {u.isActive ? "Active" : "Disabled"}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-outline" onClick={() => toggle(u)}>
                                                {u.isActive ? "Disable" : "Enable"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pager pagination={pagination} onChange={(p) => { setPage(p); setLoading(true); }} />
            </section>

            {modal === "invite" && <InviteModal onClose={() => setModal(null)} />}
            {modal === "import" && <ImportModal onClose={() => setModal(null)} onDone={load} />}
            {modal === "staff" && <StaffModal onClose={() => setModal(null)} onDone={load} />}
        </main>
    );
};

export default AdminPeople;
