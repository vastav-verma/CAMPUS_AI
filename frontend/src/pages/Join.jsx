import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";
import { getInvite, acceptInvite } from "../services/public.service";
import { apiError, categoryLabel, getHomeRoute } from "../utils/constants";

const Join = () => {
    const { token } = useParams();
    const { setSession } = useAuth();
    const navigate = useNavigate();

    const [invite, setInvite] = useState(null);
    const [problem, setProblem] = useState("");
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getInvite(token)
            .then((r) => setInvite(r.data))
            .catch((err) => setProblem(apiError(err, "This invite link is not valid.")));
    }, [token]);

    const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await acceptInvite(token, {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password
            });

            setSession(result.data);
            navigate(getHomeRoute(result.data.user.role), { replace: true });
        } catch (err) {
            setError(apiError(err, "Unable to join. Please try again."));
            setLoading(false);
        }
    };

    if (problem) {
        return (
            <AuthShell title="Invite unavailable" subtitle={problem}
                footer={<Link to="/login">Go to sign in</Link>} />
        );
    }

    if (!invite) {
        return <AuthShell title="Checking your invite..." />;
    }

    const roleText =
        invite.role === "staff"
            ? `staff member (${categoryLabel(invite.department)})`
            : "student";

    return (
        <AuthShell
            title={`Join ${invite.college.name}`}
            subtitle={`You've been invited as a ${roleText}.`}
            collegeName={invite.college.name}
            footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
        >
            <form className="form" onSubmit={handleSubmit}>
                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <label htmlFor="j-name">Full name</label>
                <input id="j-name" value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus required />

                <label htmlFor="j-email">Email</label>
                <input id="j-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />

                <label htmlFor="j-pass">Create a password</label>
                <input id="j-pass" type="password" autoComplete="new-password" minLength={8} value={form.password}
                    onChange={(e) => set("password", e.target.value)} placeholder="At least 8 characters, a letter and a number" required />

                <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
                    {loading ? "Joining..." : "Join workspace"}
                </button>
            </form>
        </AuthShell>
    );
};

export default Join;
