InsureLink Frontend (Phase 1 – Demo-Focused Development)

This repo represents the frontend-first implementation of InsureLink with a focus on:

✅ Landing & Explore Dashboards (mock/demo mode)

✅ Role-based UI structure for future real backend integration

✅ Scalable folder hierarchy aligned with Next.js App Router

✅ Shared components that will be reused in both mock + live modes

We are NOT building two different frontends — we’re building one scalable UI that works with:

Mock data for now (for pitching/demo)

Real backend later (NestJS API)

✅ Current Goals (Phase 1 Deliverable)

Public Landing Page

/explore dashboards for all roles (mock-only)

Corporate onboarding form (public)

Login page (stub only)

Shared UI components

Mock JSON data for lifecycle simulation

No backend is required at this phase.

✅ Roles & Access Strategy

We are targeting Group Health Insurance flow with these 4 stakeholders:

🧍 Patient

🏢 Corporate

🏥 Hospital

🛡 Insurer

Each will eventually have its own authenticated dashboard with role-based access.

For now, /explore/* will act as demo dashboards with mocked data.

✅ URL Structure Overview
✅ Phase 1 (Demo Mode)
/                    → Landing page
/explore             → Role selection for demo
/explore/patient
/explore/corporate
/explore/hospital
/explore/insurer
/onboard-corporate   → Sponsor onboarding form
/login               → Stub (to be activated in later phase)

✅ Phase 2 (Real Product URLs)
/patient/dashboard
/patient/claims
/patient/profile
/patient/history

/corporate/dashboard
/corporate/claims
/corporate/employees
/corporate/plans
/corporate/profile

/hospital/dashboard
/hospital/claims
/hospital/patients
/hospital/profile

/insurer/dashboard
/insurer/claims
/insurer/hospitals
/insurer/corporates
/insurer/profile


✅ Each role has clean, root-level routes (no nested /dashboard/role/... style).

✅ Final Folder Hierarchy (Next.js App Router)
app/
├── layout.tsx
├── globals.css
├── page.tsx                       ← Landing

├── explore/
│   ├── page.tsx                  ← Choose demo role
│   ├── patient/page.tsx
│   ├── corporate/page.tsx
│   ├── hospital/page.tsx
│   └── insurer/page.tsx

├── login/page.tsx
├── onboard-corporate/page.tsx

├── patient/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── claims/page.tsx
│   ├── profile/page.tsx
│   └── history/page.tsx

├── corporate/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── claims/page.tsx
│   ├── employees/page.tsx
│   ├── plans/page.tsx
│   └── profile/page.tsx

├── hospital/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── claims/page.tsx
│   ├── patients/page.tsx
│   └── profile/page.tsx

└── insurer/
    ├── layout.tsx
    ├── dashboard/page.tsx
    ├── claims/page.tsx
    ├── hospitals/page.tsx
    ├── corporates/page.tsx
    └── profile/page.tsx

✅ Supporting Directories
src/
├── components/
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── dashboards/        ← Reusable dashboard screens
│   │   ├── PatientDashboard.tsx
│   │   ├── CorporateDashboard.tsx
│   │   ├── HospitalDashboard.tsx
│   │   └── InsurerDashboard.tsx
│   ├── claims/
│   │   ├── ClaimTable.tsx
│   │   ├── ClaimCard.tsx
│   │   └── ClaimStatusBadge.tsx
│   ├── chatbot/
│   │   └── ChatWidget.tsx
│   └── shared/            ← Common UI blocks
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Modal.tsx

├── data/                  ← Mock JSON for demo mode
│   ├── claims.json
│   ├── patients.json
│   ├── corporate.json
│   └── insurer.json

├── lib/
│   ├── utils.ts
│   ├── apiClient.ts       ← For real mode later
│   └── hooks/
│       └── useFetchClaims.ts

└── types/
    ├── claims.d.ts
    ├── user.d.ts
    └── common.d.ts

✅ API (Added Later with NestJS)
app/
└── api/
    ├── claims/route.ts
    ├── auth/route.ts
    └── users/route.ts

✅ Demo vs Live Strategy

We are NOT duplicating anything. Each dashboard is built once, and can run in:

✅ Demo Mode:

Uses mock JSON (src/data/...)

No authentication

Clickable lifecycle simulation

✅ Live Mode:

Same UI components

Uses apiClient + NestJS backend

Auth & RBAC applied