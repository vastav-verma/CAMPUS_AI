import { useCallback, useEffect, useMemo, useState } from "react";

import Modal from "../components/Modal";
import StatsRow from "../components/StatsRow";
import { ListSkeleton } from "../components/Skeleton";

import { useToast } from "../context/ToastContext";

import {
    getColleges,
    createCollege,
    setCollegeActive,
    setCollegePlan
} from "../services/college.service";

import { apiError } from "../utils/constants";

const EMPTY = {
    name: "",
    collegeCode: "",
    emailDomain: "",
    adminName: "",
    adminEmail: "",
    adminPassword: ""
};

// Random password that satisfies the backend policy.
const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const bytes = crypto.getRandomValues(new Uint32Array(10));
    const body = Array.from(bytes, (n) => chars[n % chars.length]).join("");
    return `${body}7a`;
};

const SuperAdminColleges = () => {
    const toast = useToast();

    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);
    const [created, setCreated] = useState(null);

    const load = useCallback(async () => {
        try {
            const result = await getColleges();
            setColleges(result.data || []);
            setError("");
        } catch (err) {
            setError(apiError(err, "Unable to load colleges."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const stats = useMemo(
        () => ({
            total: colleges.length,
            active: colleges.filter((c) => c.isActive).length,
            students: colleges.reduce((n, c) => n + c.stats.students, 0),
            complaints: colleges.reduce((n, c) => n + c.stats.complaints, 0)
        }),
        [colleges]
    );

    const visible = colleges.filter((c) => {
        const q = search.trim().toLowerCase();
        return (
            !q ||
            c.name.toLowerCase().includes(q) ||
            c.collegeCode.toLowerCase().includes(q)
        );
    });

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]:
                name === "collegeCode"
                    ? value.toUpperCase().replace(/[^A-Z0-9_]/g, "")
                    : value
        }));
    };

    const openForm = () => {
        setForm({ ...EMPTY, adminPassword: generatePassword() });
        setFormError("");
        setShowForm(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setFormError("");

        try {
            await createCollege({
                name: form.name.trim(),
                collegeCode: form.collegeCode,
                emailDomain: form.emailDomain.trim(),
                admin: {
                    name: form.adminName.trim(),
                    email: form.adminEmail.trim(),
                    password: form.adminPassword
                }
            });

            setCreated({
                name: form.name.trim(),
                collegeCode: form.collegeCode,
                email: form.adminEmail.trim(),
                password: form.adminPassword
            });

            setShowForm(false);
            await load();
        } catch (err) {
            setFormError(apiError(err, "Unable to create the college."));
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (college) => {
        const action = college.isActive ? "disable" : "enable";

        if (
            !window.confirm(
                `Do you want to ${action} ${college.name}? ${
                    college.isActive
                        ? "Nobody from this college will be able to sign in."
                        : ""
                }`
            )
        ) {
            return;
        }

        try {
            await setCollegeActive(college._id, !college.isActive);
            toast.success(`${college.name} ${action}d.`);
            await load();
        } catch (err) {
            toast.error(apiError(err, "Unable to update the college."));
        }
    };

    const changePlan = async (college, tier) => {
        try {
            await setCollegePlan(college._id, tier);
            toast.success(`${college.name} is now on the ${tier} plan.`);
            await load();
        } catch (err) {
            toast.error(apiError(err, "Unable to change the plan."));
        }
    };

    const copyCredentials = async () => {
        const text = `College code: ${created.collegeCode}\nAdmin email: ${created.email}\nPassword: ${created.password}`;

        try {
            await navigator.clipboard.writeText(text);
            toast.success("Credentials copied.");
        } catch {
            toast.error("Copy failed. Please copy them manually.");
        }
    };

    return (
        <div className="legacy-page">

            <main className="page page">
                <header className="page-head">
                    <div>
                        <p className="eyebrow">PLATFORM</p>
                        <h1>Colleges</h1>
                        <p className="muted">
                            Onboard a new college in one step: create it with
                            its first administrator, who then manages staff,
                            documents and complaints.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={openForm}
                    >
                        + Add college
                    </button>
                </header>

                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                    </div>
                )}

                <StatsRow
                    stats={stats}
                    items={[
                        { key: "total", label: "Colleges" },
                        { key: "active", label: "Active" },
                        { key: "students", label: "Students" },
                        { key: "complaints", label: "Complaints" }
                    ]}
                />

                <section className="card">
                    <div className="card-head">
                        <h2>All colleges</h2>
                        <input
                            type="search"
                            className="search"
                            placeholder="Search name or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <ListSkeleton />
                    ) : visible.length === 0 ? (
                        <p className="empty">
                            {colleges.length === 0
                                ? "No colleges yet. Add your first one."
                                : "No college matches your search."}
                        </p>
                    ) : (
                        <div className="college-grid">
                            {visible.map((college) => (
                                <article
                                    className={`college ${
                                        college.isActive ? "" : "college-off"
                                    }`}
                                    key={college._id}
                                >
                                    <div className="college-top">
                                        <div className="college-logo">
                                            {college.name[0]}
                                        </div>

                                        <div>
                                            <h3>{college.name}</h3>
                                            <code>{college.collegeCode}</code>
                                        </div>

                                        <span
                                            className={`badge ${
                                                college.isActive
                                                    ? "status-resolved"
                                                    : "status-reopened"
                                            }`}
                                        >
                                            {college.isActive
                                                ? "Active"
                                                : "Disabled"}
                                        </span>
                                    </div>

                                    {college.emailDomain && (
                                        <p className="muted">
                                            @{college.emailDomain}
                                        </p>
                                    )}

                                    <dl className="college-stats">
                                        <div>
                                            <dd>{college.stats.students}</dd>
                                            <dt>Students</dt>
                                        </div>
                                        <div>
                                            <dd>{college.stats.staff}</dd>
                                            <dt>Staff</dt>
                                        </div>
                                        <div>
                                            <dd>{college.stats.complaints}</dd>
                                            <dt>Complaints</dt>
                                        </div>
                                    </dl>

                                    <div className="plan-row">
                                        <label htmlFor={`plan-${college._id}`}>Plan</label>
                                        <select
                                            id={`plan-${college._id}`}
                                            value={college.plan}
                                            onChange={(e) => changePlan(college, e.target.value)}
                                        >
                                            <option value="trial">
                                                Trial
                                                {college.trialDaysLeft !== null
                                                    ? ` (${college.trialDaysLeft}d left)`
                                                    : ""}
                                            </option>
                                            <option value="starter">Starter</option>
                                            <option value="pro">Pro</option>
                                        </select>
                                    </div>

                                    <div className="college-foot">
                                        <small className="muted">
                                            Added{" "}
                                            {new Date(
                                                college.createdAt
                                            ).toLocaleDateString()}
                                        </small>

                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            onClick={() => toggleActive(college)}
                                        >
                                            {college.isActive
                                                ? "Disable"
                                                : "Enable"}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {showForm && (
                <Modal
                    title="Add a new college"
                    onClose={() => setShowForm(false)}
                    wide
                >
                    <form className="form" onSubmit={handleSubmit}>
                        {formError && (
                            <div className="alert alert-error">
                                {formError}
                            </div>
                        )}

                        <h4 className="form-section">College details</h4>

                        <div className="grid-2">
                            <div>
                                <label htmlFor="col-name">College name</label>
                                <input
                                    id="col-name"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    maxLength={120}
                                    placeholder="PCTE Group of Institutes"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="col-code">
                                    College code
                                </label>
                                <input
                                    id="col-code"
                                    name="collegeCode"
                                    value={form.collegeCode}
                                    onChange={handleChange}
                                    maxLength={20}
                                    placeholder="PCTE"
                                    required
                                />
                                <small className="hint">
                                    Users type this code on the login page.
                                </small>
                            </div>
                        </div>

                        <label htmlFor="col-domain">
                            Email domain (optional)
                        </label>
                        <input
                            id="col-domain"
                            name="emailDomain"
                            value={form.emailDomain}
                            onChange={handleChange}
                            placeholder="pcte.edu.in"
                        />

                        <h4 className="form-section">
                            First college administrator
                        </h4>

                        <div className="grid-2">
                            <div>
                                <label htmlFor="adm-name">Admin name</label>
                                <input
                                    id="adm-name"
                                    name="adminName"
                                    value={form.adminName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="adm-email">Admin email</label>
                                <input
                                    id="adm-email"
                                    name="adminEmail"
                                    type="email"
                                    value={form.adminEmail}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <label htmlFor="adm-pass">Temporary password</label>
                        <div className="inline">
                            <input
                                id="adm-pass"
                                name="adminPassword"
                                value={form.adminPassword}
                                onChange={handleChange}
                                minLength={8}
                                required
                            />
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() =>
                                    setForm((prev) => ({
                                        ...prev,
                                        adminPassword: generatePassword()
                                    }))
                                }
                            >
                                Generate
                            </button>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? "Creating..." : "Create college"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {created && (
                <Modal
                    title="College created"
                    onClose={() => setCreated(null)}
                >
                    <div className="form">
                        <div className="alert alert-success">
                            <strong>{created.name}</strong> is ready. This
                            password is shown only now, so share it securely.
                        </div>

                        <dl className="creds">
                            <div>
                                <dt>College code</dt>
                                <dd>{created.collegeCode}</dd>
                            </div>
                            <div>
                                <dt>Admin email</dt>
                                <dd>{created.email}</dd>
                            </div>
                            <div>
                                <dt>Temporary password</dt>
                                <dd>{created.password}</dd>
                            </div>
                        </dl>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={copyCredentials}
                            >
                                Copy credentials
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setCreated(null)}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default SuperAdminColleges;
