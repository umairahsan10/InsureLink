# InsureLink Project Overview

## Project Snapshot
- **Goal**: Unified insurance operations platform connecting insurers, hospitals, corporates, and patients.
- **Tech Stack**: Next.js App Router frontend (`client/`), NestJS modular backend (`server/`), shared TypeScript models, and content/docs in `docs/`.
- **Data Strategy**: Rich JSON fixtures under `client/src/data/` support interactive prototypes; scripts in `scripts/` enrich datasets (e.g., Karachi hospital geocoding).
- **Deployment Targets**: Frontend expects `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_URL` for API/WebSocket endpoints; backend exposes REST + Socket.IO gateways.

## Frontend Highlights (`client/`)
- **Landing & Exploration**: Marketing home and role exploration journeys showcase platform value and guide users to role-based portals (`app/page.tsx`, `app/explore/*`).
- **Authentication & Onboarding**: Auth flows built on the App Router (`app/login/page.tsx`) with dedicated onboarding for corporates (`app/onboard-corporate/page.tsx`).
- **Role-Specific Portals**:
  - **Patients**: Claims dashboard, coverage balances, smart hospital discovery, labs directory, and profile experience (`app/patient/*`).
  - **Corporates**: Employee roster management with add/remove flows, dependent approvals, bulk CSV/XLSX import, and plan insights (`app/corporate/*`, `components/corporate/*`).
  - **Hospitals**: Operational dashboard with patient verification, claim triage, alerts, and claim-centric messaging (`app/hospital/*`, `components/hospital/*`).
  - **Insurers**: Network oversight—claims pipeline, corporate engagement, hospital relationships, analytics snapshots (`app/insurer/*`, `components/insurer/*`).
- **Claims Operations**: Shared claim components (tables, status badges, cards) and API routes simulate end-to-end submission, filtering, and status tracking (`components/claims/*`, `app/api/claims/route.ts`).
- **Real-Time Collaboration**: `ClaimsMessagingContext` + modal/chat UI enable hospital ↔ insurer conversations with attachment handling and tab-sync via BroadcastChannel (`contexts/ClaimsMessagingContext.tsx`, `components/messaging/*`).
- **Notifications & Alerts**: Role-specific notification panels draw from JSON seeds and integrate with messaging alerts (`components/notifications/NotificationPanel.tsx`, `data/*Notifications.json`).
- **Analytics Dashboards**: Reusable cards/charts display KPIs for each stakeholder using `analytics.json`, with placeholder chart components ready for data hookups (`components/dashboards/*`, `data/analytics.json`).
- **Smart Hospital Finder**: Karachi-centric map/list experience powered by geolocation utilities, enriched hospital dataset, and Leaflet visualizations (`app/patient/hospitals/*`, `utils/location.ts`, `data/hospitals.enriched.json`).
- **Data Import Toolkit**: CSV/Excel template generator script, file parser, column mapping, and validator enforce Pakistan-specific formats (CNIC, mobile) and duplicate detection (`scripts/generate-template.js`, `utils/fileParser.ts`, `utils/employeeValidator.ts`).
- **Shared Foundations**: Theme styles (`app/globals.css`, `styles/*`), headless UI primitives (`components/common/Button.tsx`, `components/shared/Card.tsx`), hooks (auth, geolocation, WebSocket, broadcast channel), and TypeScript definitions under `types/`.

## Data, Scripts, and Tooling
- **Domain Fixtures**: JSON datasets for claims, chats, corporates, dependents, hospitals, notifications, labs, plans, analytics, etc., enabling realistic UX without a live API (`client/src/data/`).
- **Geospatial Enrichment**: `scripts/geocode-hospitals.ts` enriches Karachi hospitals with coordinates, persistence cache, and deterministic emergency/24-7 flags.
- **Template Generation**: `client/public/templates/` and `scripts/generate-template.js` supply import templates aligned with validation rules.
- **Docs & Decisions**: `docs/` captures meeting notes, archived structure phases, and feature briefs (e.g., smart hospital finder deep dive).

## Platform Considerations
- **State Management**: Contexts for auth and claims messaging, with hooks abstracting browser APIs (geolocation, broadcast channel, WebSocket).
- **Accessibility & Responsiveness**: Tailwind-based layouts maintain consistency across breakpoints, with attention to keyboard-friendly components and semantic markup.
- **Extensibility**: Type definitions and modular components ease integration with live APIs; backend stubs mark clear extension points for persistence, third-party services, and event processing.

## Next Steps (Suggested)
- Replace placeholder auth/claims logic with real repositories and persistence.
- Connect frontend data hooks to backend endpoints or GraphQL once available.
- Expand geocoding coverage beyond Karachi and address known hospital coordinate gaps.
- Harden messaging by wiring WebSocket gateway + persistence for audit trails.



