# CampusAI: multi-tenant SaaS for colleges

An AI assistant (RAG over each college's own documents) + a complaint-resolution desk,
delivered as a self-serve SaaS. **The RAG pipeline (`backend/src/services/rag`, chat
controller, embeddings, document processing) is unchanged from the original project.**

## Run locally
    cd backend  && cp .env.example .env   # fill MONGO_URI, JWT_SECRET, API keys
                   npm install && npm run dev
    cd frontend && npm install && npm run dev

## How a new college joins (no developer needed)
1. Visit `/signup`: college name -> auto-suggested college code -> admin account.
   A workspace with a 14-day free trial is created and the admin is signed in.
2. The Overview page shows a "Get started" checklist:
   - Knowledge base: drag & drop PDF / TXT / MD files
   - People: **Invite link** (one URL for hundreds of students/staff) or **Import CSV**
     (credentials CSV is downloadable once) or add a single staff member
   - Settings: assistant name, welcome message, brand colour, self-registration toggle
3. Students/staff open `/join/<token>` and create their own account.

The platform owner can still onboard colleges manually and change plans:
    node scripts/createSuperAdmin.js owner@you.com "StrongPass123" "Your Name"
    login at /login with college code PLATFORM -> /super-admin

## Roles & screens
| Role | Screens |
|---|---|
| Public | `/` landing + pricing, `/signup`, `/login`, `/join/:token` |
| Student | `/chat` (AI assistant), `/complaints`, `/notifications` |
| Staff | `/staff` (assigned complaints, resolve with optional image proof) |
| College admin | `/admin` overview + analytics, `/admin/complaints`, `/admin/people`, `/admin/knowledge`, `/admin/settings`, `/admin/billing` |
| Super admin | `/super-admin` all colleges, plan changes, enable/disable |

## Plans (backend/src/constants/plans.js)
trial (14 days: 100 students / 5 staff / 5 docs), starter, pro. Limits are enforced on signup,
invite-accept, CSV import, staff creation and document upload (HTTP 402 with an upgrade message).
Payments are not integrated: plan changes are made by the super admin (add Stripe/Razorpay webhooks
that call the same `plan.tier` update when you are ready).

## API additions (all under /api)
Public (rate limited): POST /public/signup, GET /public/college-code/:code, GET /public/college-code/suggest?name=,
GET /public/colleges/:code, GET /public/invites/:token, POST /public/invites/:token/accept
Workspace (auth): GET /workspace/college, PATCH /workspace/college (admin), GET /workspace/billing (admin),
GET|POST /workspace/invites, DELETE /workspace/invites/:id, GET /workspace/users, POST /workspace/users/import,
PATCH /workspace/users/:id/active
Complaints / notifications / chat / documents: as before (see code), plus GET /complaints/analytics.
