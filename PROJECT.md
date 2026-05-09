# InsureLink — Unified Insurance Operations Platform

**Final Year Project — Open House 2026**

**Supervisor:** Usama Antuley  
**Co-Supervisor:** Dr. Sufian Hameed

**Team Members:**
- 22K-4275 Umair Ahsan
- 22K-4132 Muhammad Aliyan Malik
- 22K-4407 Muhammad Saad

---

## 1. Project Overview

InsureLink is a **health insurance claims management system** that digitizes the entire insurance claim lifecycle by unifying five key stakeholders — insurers, hospitals, corporates, patients, and system administrators — on a single real-time platform.

The platform replaces Pakistan's current manual claim process — which relies on phone calls, emails, and fragmented spreadsheets — with a fully digital workflow: claim submission, coverage validation, insurer review, real-time status updates, and audit logging, all within one integrated system.

**Tech Stack:** Next.js 16 (App Router) + React 19, NestJS 11, TypeScript, Tailwind CSS 4, Prisma ORM 7, PostgreSQL, Socket.IO, Supabase Storage, Leaflet.

---

## 2. Problem Statement & Motivation

Insurance claim operations in Pakistan remain heavily manual:

- **Hospitals** call and email insurers to verify coverage and seek approvals, causing delays and miscommunication.
- **Patients** have zero real-time visibility into claim status, approval progress, or remaining coverage balances.
- **Corporate HR departments** manage employee insurance data through fragmented spreadsheets with no centralized record-keeping.
- **Insurers** process claims without automated audit trails, making fraud detection and reconciliation difficult.
- **No unified digital platform** exists that connects all five stakeholders in one integrated system.

This results in high turnaround times, frequent errors, lack of transparency, and zero auditability.

---

## 3. Objectives & Scope

### Primary Objectives
1. Digitize the end-to-end insurance claim lifecycle from submission to payment.
2. Provide role-based portals tailored to each stakeholder's workflow.
3. Enable real-time claim status synchronization across all portals via Socket.IO.
4. Automate coverage validation, employee onboarding, and dependent management.
5. Implement audit trails and analytics for insurer oversight and compliance.

### Scope
- **Included:** 5 role-based portals, 50+ REST APIs, real-time messaging, bulk employee upload, smart hospital finder, claims analytics, audit logging, JWT-based auth with RBAC.
- **Not Included:** Live payment gateway integration, native mobile application, machine learning-based fraud detection (explored but not productionized), nationwide hospital network beyond Karachi.

---

## 4. System Architecture

### High-Level Architecture

InsureLink follows a **three-tier architecture**:

**Presentation Layer — Next.js App Router**
- 5 role-based portals (Admin, Patient, Hospital, Corporate, Insurer)
- Built with React 19, TypeScript, Tailwind CSS 4
- Real-time client via Socket.IO Client
- Geolocation-powered hospital finder via Leaflet

**Application Layer — NestJS 11 Modular Backend**
- 12 domain modules: Auth, Claims, Patients, Employees, Dependents, Corporates, Hospitals, Insurers, Messaging, Notifications, Analytics, Audit
- Socket.IO Gateway for real-time claim-scoped chat and notifications
- EventEmitter2 for event-driven notification pipeline
- JWT/Passport authentication with role guards and rate limiting

**Data Layer**
- PostgreSQL relational database (15+ entities)
- Prisma ORM for type-safe database access
- Supabase Storage for claim documents and attachments

### Request Flow
```
Browser → Next.js (SSR + Client) → NestJS REST API → Prisma → PostgreSQL
Browser ↔ Socket.IO ↔ Messaging Gateway → Database
```

---

## 5. Key Modules & Features

### 5.1 Admin Portal
- System-wide KPI dashboard (claims, coverage, users, approval rates)
- User management: create, edit, deactivate, delete, bulk operations
- Broadcast notifications to specific roles or all users
- Fraud monitoring dashboard (duplicate amounts, high-frequency claims, high-value claims)
- Full audit log viewer with CSV export
- Organization management (corporates, hospitals, insurers)

### 5.2 Patient Portal
- Coverage balance dashboard with progress bar and claim statistics
- Self-service claim submission with hospital selection, dates, amount, and document upload
- Claim history with filtering by status, date range, and search
- Smart hospital finder with geolocation-based distance sorting and reimbursable/non-reimbursable filtering
- Dependent management: add dependents with corporate approval workflow
- Real-time claim status notifications

### 5.3 Hospital Portal
- Patient verification by CNIC
- Hospital visit registration (employee + optional dependent)
- Claim submission linked to registered visits
- Claims management with status tracking and filtering
- Real-time messaging with insurers on specific claims
- Emergency contact management
- Profile management

### 5.4 Corporate Portal
- Employee roster management: single add and bulk CSV/Excel upload
- Dependent approval/rejection workflow
- Claims overview (read-only) for all employees and dependents
- Insurance plan viewer
- Coverage utilization analytics
- Profile and contract management

### 5.5 Insurer Portal
- Claims pipeline: review, approve, reject, hold, and mark as paid
- Bulk approve multiple pending claims
- Insurance plan CRUD with covered services and per-service limits
- Network hospital and lab management with approval workflow
- Corporate client monitoring with employee and dependent lookup
- Document extraction from PDF claim forms
- Real-time messaging with hospitals and corporates

### 5.6 Shared Platform Features
- **Real-Time Claims Sync:** Socket.IO-powered live status updates across all portals
- **Claims Messaging:** Claim-scoped chat rooms with attachments, typing indicators, and read receipts
- **Notifications:** Event-driven in-app and push notifications for claim status changes, dependent requests, and messages
- **Audit Trail:** Field-level diff logging for all CREATE, UPDATE, and DELETE operations with CSV export
- **Analytics:** Role-based dashboards with claims trends, coverage utilization, and top hospital rankings

---

## 6. Implementation Details

### Database Design
The PostgreSQL schema includes 15+ entities with rich relationships:

**Core Entities:**
- `User` — authentication, roles (admin, patient, corporate, hospital, insurer), profile fields
- `Employee` — linked to Corporate and Plan, coverage tracking (total, used, remaining)
- `Dependent` — linked to Employee, corporate approval workflow
- `Claim` — claim number, status (Pending, Approved, Rejected, OnHold, Paid), amounts, auto-populated relations
- `HospitalVisit` — links employee/dependent to hospital, claimable
- `Hospital`, `Insurer`, `Corporate`, `Plan`, `Lab` — organizational profiles
- `ChatMessage`, `Notification`, `AuditLog` — messaging, alerts, and audit trails

### API Design
- **RESTful APIs** with resource-based URL patterns (`/api/v1/claims`, `/api/v1/patients/me`)
- **DTOs** with class-validator for request validation
- **Role-based filtering** on every endpoint — users can only access their organization's data
- **Pagination, search, and filtering** on all list endpoints

### Security Mechanisms
- **JWT Authentication:** Access tokens (15-minute expiry) + refresh tokens (7-day expiry)
- **Role-Based Access Control:** `@RolesGuard` on every write endpoint; cross-organizational access blocked with `ForbiddenException`
- **Rate Limiting:** 100 requests/min global, 10/min login, 5/min register
- **Audit Trail:** `@Auditable` decorator automatically captures field-level diffs on all mutations
- **Data Isolation:** Service-layer enforcement ensures a corporate cannot see another corporate's employees, a hospital cannot see another hospital's claims, etc.

### Real-Time Communication
- **Socket.IO Gateway** manages claim-scoped chat rooms
- **Events:** `join-claim-room`, `leave-claim-room`, `send-message`, `claim-message-new`, `claim-message-read`, `user-typing`
- **EventEmitter2** decouples notification creation from business logic — claims service emits events, notification producer listens and creates alerts

---

## 7. References

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.IO Documentation](https://socket.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
