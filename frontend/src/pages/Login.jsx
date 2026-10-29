import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";
import { getCollegeBranding } from "../services/public.service";
import { apiError, getHomeRoute } from "../utils/constants";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [collegeCode, setCollegeCode] = useState(
        () => localStorage.getItem("lastCollegeCode") || ""
    );
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [branding, setBranding] = useState(null);

    // Show the college's name once a valid code is typed.
    useEffect(() => {
        const code = collegeCode.trim();

        if (code.length < 2) return undefined;

        const timer = setTimeout(() => {
            getCollegeBranding(code)
                .then((r) => setBranding(r.data))
                .catch(() => setBranding(null));
        }, 400);

        return () => clearTimeout(timer);
    }, [collegeCode]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const code = collegeCode.trim().toUpperCase();
            const result = await login(email.trim(), password, code);

            localStorage.setItem("lastCollegeCode", code);
            navigate(getHomeRoute((result?.data?.user || result?.user)?.role));
        } catch (err) {
            setError(apiError(err, "Unable to sign in. Check your details."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Welcome back"
            subtitle="Sign in to your college workspace."
            collegeName={collegeCode.trim().length >= 2 ? branding?.name : ""}
            footer={
                <>
                    New college? <Link to="/signup">Create a workspace</Link>
                    <br />
                    Student or staff? Use the invite link from your administrator.
                </>
            }
        >
            <form className="form" onSubmit={handleSubmit}>
                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <label htmlFor="l-code">College code</label>
                <input
                    id="l-code"
                    value={collegeCode}
                    onChange={(e) => setCollegeCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PCTE"
                    autoCapitalize="characters"
                    required
                />
                {branding && collegeCode.trim().length >= 2 && (
                    <small className="ok-text">✓ {branding.name}</small>
                )}

                <label htmlFor="l-email">Email</label>
                <input
                    id="l-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <label htmlFor="l-pass">Password</label>
                <div className="input-with-btn">
                    <input
                        id="l-pass"
                        type={show ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="button" className="link-btn" onClick={() => setShow((v) => !v)}>
                        {show ? "Hide" : "Show"}
                    </button>
                </div>

                <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                </button>
            </form>
        </AuthShell>
    );
};

export default Login;
