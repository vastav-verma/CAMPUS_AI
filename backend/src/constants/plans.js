// SaaS plans. Limits are enforced when users or documents are created.
export const PLANS = {
    trial: {
        label: "Free trial",
        price: 0,
        trialDays: 14,
        limits: { students: 100, staff: 5, documents: 5 }
    },
    starter: {
        label: "Starter",
        price: 49,
        limits: { students: 500, staff: 20, documents: 25 }
    },
    pro: {
        label: "Pro",
        price: 199,
        limits: { students: 5000, staff: 200, documents: 200 }
    }
};

export const PLAN_TIERS = Object.keys(PLANS);
