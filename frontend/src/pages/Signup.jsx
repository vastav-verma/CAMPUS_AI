import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";

import {
    signupCollege,
    checkCodeAvailable,
    suggestCollegeCode
} from "../services/public.service";

import { apiError } from "../utils/constants";

const strength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) score += 1;
    if (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)) score += 1;
    return score;
};

const Signup = () => {
    const { setSession } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        collegeName: "",
        collegeCode: "",
        adminName: "",
        email: "",
        password: ""
    });
    const [codeTouched, setCodeTouched] = useState(false);
    const [codeState, setCodeState] = useState(null); // {available, reason}
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

    // Suggest a code from the college name until the user edits it.
    useEffect(() => {
        if (codeTouched || form.collegeName.trim().length < 3) return undefined;

        const timer = setTimeout(() => {
            suggestCollegeCode(form.collegeName.trim())
                .then((r) => set("collegeCode", r.data.code))
                .catch(() => {});
        }, 450);

        return () => clearTimeout(timer);
    }, [form.collegeName, codeTouched]);

    // Live availability check.
    useEffect(() => {
        if (form.collegeCode.length < 2) return undefined;

        const timer = setTimeout(() => {
            checkCodeAvailable(form.collegeCode)
                .then((r) => setCodeState(r.data))
                .catch(() => setCodeState(null));
        }, 350);

        return () => clearTimeout(timer);
    }, [form.collegeCode]);

    const goNext = (event) => {
        event.preventDefault();
        setError("");

        if (!form.collegeName.trim()) return setError("Enter your college name.");
        if (!codeState?.available) return setError("Choose an available college code.");

        setStep(2);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signupCollege({
                ...form,
                collegeName: form.collegeName.trim(),
                adminName: form.adminName.trim(),
                email: form.email.trim()
            });

            setSession(result.data);
            navigate("/admin?welcome=1", { replace: true });
        } catch (err) {
            setError(apiError(err, "Unable to create your workspace."));
            setLoading(false);
        }
    };

    const score = strength(form.password);

    return (
        <AuthShell
            title="Create your college workspace"
            subtitle="Free for 14 days. No credit card needed."
            footer={<>Already have a workspace? <Link to="/login">Sign in</Link></>}
        >
            <ol className="stepper" aria-label="Progress">
                <li className={step >= 1 ? "on" : ""}>1 · College</li>
                <li className={step >= 2 ? "on" : ""}>2 · Your account</li>
            </ol>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            {step === 1 ? (
                <form className="form" onSubmit={goNext}>
                    <label htmlFor="s-college">College name</label>
                    <input
                        id="s-college"
                        value={form.collegeName}
                        onChange={(e) => set("collegeName", e.target.value)}
                        placeholder="PCTE Group of Institutes"
                        maxLength={120}
                        autoFocus
                        required
                    />

                    <label htmlFor="s-code">College code</label>
                    <input
                        id="s-code"
                        value={form.collegeCode}
                        onChange={(e) => {
                            setCodeTouched(true);
                            set("collegeCode", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""));
                        }}
                        placeholder="PCTE"
                        maxLength={20}
                        required
                    />
                    <small className={codeState ? (codeState.available ? "ok-text" : "err-text") : "hint"}>
                        {codeState
                            ? codeState.available
                                ? "✓ Available"
                                : codeState.reason || "Already taken, try another"
                            : "Students and staff type this code on the login page."}
                    </small>

                    <button className="btn btn-primary btn-block btn-lg">Continue</button>
                </form>
            ) : (
                <form className="form" onSubmit={handleSubmit}>
                    <label htmlFor="s-name">Your name</label>
                    <input
                        id="s-name"
                        value={form.adminName}
                        onChange={(e) => set("adminName", e.target.value)}
                        maxLength={100}
                        autoFocus
                        required
                    />

                    <label htmlFor="s-email">Work email</label>
                    <input
                        id="s-email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        required
                    />

                    <label htmlFor="s-pass">Password</label>
                    <input
                        id="s-pass"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        value={form.password}
                        onChange={(e) => set("password", e.target.value)}
                        placeholder="At least 8 characters, a letter and a number"
                        required
                    />
                    <div className="meter" aria-hidden="true">
                        {[1, 2, 3].map((n) => (
                            <i key={n} className={score >= n ? `on on-${score}` : ""} />
                        ))}
                    </div>

                    <div className="form-row">
                        <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                            Back
                        </button>
                        <button className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 1 }}>
                            {loading ? "Creating workspace..." : "Create workspace"}
                        </button>
                    </div>
                </form>
            )}
        </AuthShell>
    );
};

export default Signup;
