import { useEffect, useState } from "react";

import Icon from "../components/Icon";
import { BlockSkeleton } from "../components/Skeleton";
import { getBilling } from "../services/workspace.service";
import { apiError } from "../utils/constants";

const PLANS = [
    { tier: "trial", name: "Free trial", price: "$0", limits: ["100 students", "5 staff", "5 documents"] },
    { tier: "starter", name: "Starter", price: "$49/mo", limits: ["500 students", "20 staff", "25 documents"] },
    { tier: "pro", name: "Pro", price: "$199/mo", limits: ["5,000 students", "200 staff", "200 documents"] }
];

const Meter = ({ label, used, limit }) => {
    const pct = Math.min(Math.round((used / limit) * 100), 100);

    return (
        <div className="meter-row">
            <div className="meter-top">
                <span>{label}</span>
                <strong>{used} / {limit}</strong>
            </div>
            <div className="hbar-track">
                <div className="hbar-fill" style={{ width: `${pct}%`, background: pct >= 90 ? "#dc2626" : "var(--brand)" }} />
            </div>
        </div>
    );
};

const AdminBilling = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getBilling()
            .then((r) => setData(r.data))
            .catch((err) => setError(apiError(err, "Unable to load billing.")));
    }, []);

    return (
        <main className="page">
            <header className="page-head">
                <div>
                    <h1>Plan &amp; billing</h1>
                    <p className="muted">Your current plan, usage and upgrade options.</p>
                </div>
            </header>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            {!data ? (
                <BlockSkeleton height={200} />
            ) : (
                <>
                    {data.expired && (
                        <div className="alert alert-warn">
                            Your free trial has ended. Existing data is safe, but you can't add people or
                            documents until you upgrade.
                        </div>
                    )}

                    <section className="card">
                        <div className="card-head">
                            <h2>Current plan: {data.label}</h2>
                            {data.trialDaysLeft !== null && (
                                <span className="badge status-submitted">
                                    {data.trialDaysLeft} days left
                                </span>
                            )}
                        </div>

                        <Meter label="Students" used={data.usage.students} limit={data.limits.students} />
                        <Meter label="Staff" used={data.usage.staff} limit={data.limits.staff} />
                        <Meter label="Documents" used={data.usage.documents} limit={data.limits.documents} />
                    </section>

                    <div className="price-grid">
                        {PLANS.map((plan) => {
                            const current = plan.tier === data.tier;

                            return (
                                <article key={plan.tier} className={`price ${current ? "price-featured" : ""}`}>
                                    {current && <span className="price-flag">Current plan</span>}
                                    <h3>{plan.name}</h3>
                                    <div className="price-amt">{plan.price}</div>
                                    <ul>
                                        {plan.limits.map((l) => (
                                            <li key={l}><Icon name="check" size={15} /> {l}</li>
                                        ))}
                                    </ul>

                                    {current ? (
                                        <button className="btn btn-outline btn-block" disabled>Active</button>
                                    ) : plan.tier === "trial" ? null : (
                                        <a
                                            className="btn btn-primary btn-block"
                                            href={`mailto:sales@campusai.app?subject=Upgrade to ${plan.name}`}
                                        >
                                            Upgrade to {plan.name}
                                        </a>
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    <p className="muted small">
                        Upgrades are activated by our team within one business day. Online payments can be
                        connected (Stripe / Razorpay) in a later release.
                    </p>
                </>
            )}
        </main>
    );
};

export default AdminBilling;
