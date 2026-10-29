import { Link } from "react-router-dom";

import Icon from "../components/Icon";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { getHomeRoute } from "../utils/constants";

const FEATURES = [
    { icon: "sparkle", title: "AI that knows your college", text: "Upload prospectuses, rulebooks and circulars. Students get accurate answers drawn only from your documents." },
    { icon: "ticket", title: "Complaint desk with proof", text: "Complaints reach the right department instantly. Staff resolve them with an optional photo as evidence." },
    { icon: "bell", title: "Real-time notifications", text: "Staff are alerted the moment a complaint arrives; students the moment it is resolved." },
    { icon: "link", title: "One-link onboarding", text: "Share a single invite link or import a CSV. Hundreds of students and staff join in minutes." },
    { icon: "chart", title: "Analytics for admins", text: "Track resolution rate, response time, busiest categories and your top-performing staff." },
    { icon: "shield", title: "Private by design", text: "Every college is an isolated workspace. Your documents and conversations never mix with another college's." }
];

const STEPS = [
    { n: "1", title: "Create your workspace", text: "Sign up with your college name. No credit card, no setup call." },
    { n: "2", title: "Add knowledge & people", text: "Upload documents, then invite students and staff with a link or CSV." },
    { n: "3", title: "Go live", text: "Students chat with your AI assistant and raise complaints from day one." }
];

const PRICING = [
    { name: "Free trial", price: "$0", note: "14 days, no card", features: ["100 students", "5 staff", "5 documents", "AI assistant + complaints"], cta: "Start free" },
    { name: "Starter", price: "$49", note: "per month", features: ["500 students", "20 staff", "25 documents", "Analytics dashboard", "Email support"], cta: "Start free", featured: true },
    { name: "Pro", price: "$199", note: "per month", features: ["5,000 students", "200 staff", "200 documents", "Custom branding", "Priority support"], cta: "Start free" }
];

const Landing = () => {
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="landing">
            <header className="land-nav">
                <Link to="/"><Logo /></Link>

                <nav className="land-links">
                    <a href="#features">Features</a>
                    <a href="#how">How it works</a>
                    <a href="#pricing">Pricing</a>
                </nav>

                <div className="land-cta">
                    {isAuthenticated ? (
                        <Link className="btn btn-primary" to={getHomeRoute(user?.role)}>
                            Open dashboard
                        </Link>
                    ) : (
                        <>
                            <Link className="btn btn-quiet" to="/login">Log in</Link>
                            <Link className="btn btn-primary" to="/signup">Start free</Link>
                        </>
                    )}
                </div>
            </header>

            <section className="hero">
                <div className="hero-copy">
                    <span className="pill"><Icon name="zap" size={14} /> Live in under 10 minutes</span>
                    <h1>
                        The AI assistant and complaint desk <em>every college needs</em>
                    </h1>
                    <p>
                        CampusAI answers student questions from your own documents and
                        routes complaints to the right staff, with notifications at every
                        step. One workspace per college, ready the same day.
                    </p>

                    <div className="hero-actions">
                        <Link className="btn btn-primary btn-lg" to="/signup">
                            Create your college workspace
                        </Link>
                        <a className="btn btn-outline btn-lg" href="#how">See how it works</a>
                    </div>

                    <small className="hero-note">Free for 14 days · No credit card required</small>
                </div>

                <div className="hero-visual" aria-hidden="true">
                    <div className="mock mock-chat">
                        <div className="mock-head"><span className="dot" /> Campus Assistant</div>
                        <div className="mock-msg mock-user">What is the minimum attendance for exams?</div>
                        <div className="mock-msg mock-bot">
                            Students need <strong>75% attendance</strong> to appear in end-semester exams.
                            Medical leave can be condoned with a certificate.
                            <span className="mock-src">Source: Student Handbook</span>
                        </div>
                    </div>

                    <div className="mock mock-ticket">
                        <div className="mock-row">
                            <strong>Wi-Fi slow in library</strong>
                            <span className="badge status-resolved">Resolved</span>
                        </div>
                        <small>Resolved by IT dept · proof attached</small>
                        <div className="mock-bar"><i /></div>
                    </div>
                </div>
            </section>

            <section id="features" className="land-section">
                <h2>Everything a college support desk needs</h2>
                <p className="land-sub">One platform replaces scattered WhatsApp groups, notice boards and email chains.</p>

                <div className="feature-grid">
                    {FEATURES.map((f) => (
                        <article className="feature" key={f.title}>
                            <span className="feature-icon"><Icon name={f.icon} size={20} /></span>
                            <h3>{f.title}</h3>
                            <p>{f.text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="how" className="land-section land-tint">
                <h2>Up and running in three steps</h2>

                <div className="steps">
                    {STEPS.map((s) => (
                        <div className="step" key={s.n}>
                            <span className="step-n">{s.n}</span>
                            <h3>{s.title}</h3>
                            <p>{s.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section id="pricing" className="land-section">
                <h2>Simple pricing that grows with your college</h2>
                <p className="land-sub">Start free. Upgrade only when you need more capacity.</p>

                <div className="price-grid">
                    {PRICING.map((plan) => (
                        <article className={`price ${plan.featured ? "price-featured" : ""}`} key={plan.name}>
                            {plan.featured && <span className="price-flag">Most popular</span>}
                            <h3>{plan.name}</h3>
                            <div className="price-amt">{plan.price}<small> {plan.note}</small></div>
                            <ul>
                                {plan.features.map((f) => (
                                    <li key={f}><Icon name="check" size={15} /> {f}</li>
                                ))}
                            </ul>
                            <Link className={`btn ${plan.featured ? "btn-primary" : "btn-outline"} btn-block`} to="/signup">
                                {plan.cta}
                            </Link>
                        </article>
                    ))}
                </div>
            </section>

            <section className="land-final">
                <h2>Give every student an answer and every complaint an owner.</h2>
                <Link className="btn btn-light btn-lg" to="/signup">Create your workspace</Link>
            </section>

            <footer className="land-foot">
                <Logo />
                <small>&copy; {new Date().getFullYear()} CampusAI. All rights reserved.</small>
            </footer>
        </div>
    );
};

export default Landing;
