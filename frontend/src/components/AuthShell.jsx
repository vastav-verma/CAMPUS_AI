import { Link } from "react-router-dom";

import Icon from "./Icon";
import Logo from "./Logo";

const POINTS = [
    "Ask the AI assistant anything about college",
    "Raise complaints and track them to resolution",
    "Get notified the moment your issue is resolved"
];

// Two-column layout shared by login, signup and invite pages.
const AuthShell = ({ title, subtitle, children, footer, collegeName }) => (
    <div className="auth">
        <aside className="auth-side">
            <Link to="/"><Logo light /></Link>

            <div>
                <h2>{collegeName ? collegeName : "Smarter support for your campus"}</h2>
                <ul>
                    {POINTS.map((p) => (
                        <li key={p}><Icon name="check" size={16} /> {p}</li>
                    ))}
                </ul>
            </div>

            <small>&copy; {new Date().getFullYear()} CampusAI</small>
        </aside>

        <main className="auth-main">
            <div className="auth-card">
                <h1>{title}</h1>
                {subtitle && <p className="muted">{subtitle}</p>}
                {children}
                {footer && <div className="auth-foot">{footer}</div>}
            </div>
        </main>
    </div>
);

export default AuthShell;
