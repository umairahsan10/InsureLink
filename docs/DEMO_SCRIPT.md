# InsureLink FYP Demo Video Script
## Complete Director's Guide for Final Year Project Presentation

---

## Pre-Demo Setup

### Browser Profile Setup (Recommended)
To demonstrate real-time sync and multi-portal interaction seamlessly, use separate Chrome/Edge browser profiles:

| Profile Name | Portal | Color Theme |
|-------------|--------|-------------|
| `InsureLink-Patient` | Patient Portal | Blue |
| `InsureLink-Hospital` | Hospital Portal | Green |
| `InsureLink-Insurer` | Insurer Portal | Red/Orange |
| `InsureLink-Corporate` | Corporate Portal | Purple |
| `InsureLink-Admin` | Admin Portal | Dark/Gray |

**Setup Instructions:**
1. Open Chrome → Click profile icon (top right) → "Add"
2. Name each profile and assign a color
3. Pin the InsureLink tab in each profile
4. Arrange windows side-by-side or use virtual desktops for the real-time sync scene

### Pre-Recording Checklist
- [ ] Start both frontend (`npm run dev` in client) and backend (`npm run start:dev` in server)
- [ ] Verify database is seeded with your existing data
- [ ] Open all 5 portals in their respective browser profiles and login
- [ ] Clear browser notifications to avoid distractions
- [ ] Set screen recorder to 1080p, 30fps
- [ ] Have your login credentials handy on a sticky note (not visible on screen)
- [ ] Practice the tab-switch sequence for Act 5 at least once
- [ ] Close unnecessary apps/tabs to keep taskbar clean

---

## Act 1: The Problem & The Platform (0:00 – 1:30)

### Scene 1.1: Landing Page (0:00 – 0:45)
**Navigate to:** `http://localhost:3000/`

**What to Show:**
- The animated hero section with "Pakistan's Smart Health Insurance Platform"
- The four feature cards: Insurers, Hospitals, Corporates, Patients
- The stats bar at the bottom: 4 User Roles, Real-time Claim Tracking, Secure End-to-End, Smart AI-Powered

**Speaking Script:**
> "Good morning. My name is [Your Name], and this is my Final Year Project: InsureLink — a unified health insurance claims management platform built for Pakistan.
>
> Right now, insurance claims in our country run on phone calls, WhatsApp messages, and Excel spreadsheets. Hospitals call insurers to verify coverage. Patients have zero visibility into their claim status. And corporates manage thousands of employee records manually.
>
> InsureLink solves this by digitizing the entire claim lifecycle and unifying five key stakeholders — insurers, hospitals, corporates, patients, and system administrators — on a single real-time platform."

**Recording Tip:** Let the page animations play out naturally. Pause for 2 seconds after the hero text fully renders.

---

### Scene 1.2: Explore Roles (0:45 – 1:30)
**Click:** "Explore Platform" button (or navigate to `/explore`)

**What to Show:**
- The four role cards: Patient, Corporate, Hospital, Insurer
- Briefly hover over each card to show the color transition

**Speaking Script:**
> "InsureLink provides dedicated, role-based portals tailored to each stakeholder's workflow. Let me give you a quick preview.
>
> For patients, it's about self-service claim submission and real-time tracking. For hospitals, it's instant patient verification and digital claim submission. For insurers, it's an intelligent claims pipeline with fraud detection. And for corporates, it's bulk employee management and coverage oversight.
>
> Let's dive in, starting with the patient experience."

**Recording Tip:** Click each explore role briefly (Patient, Hospital, Insurer, Corporate) to show their respective demo pages. Spend ~5 seconds per page. End on the Patient explore page, then cut to the login screen.

---

## Act 2: Patient Journey (1:30 – 4:30)

### Scene 2.1: Login as Patient (1:30 – 1:50)
**Navigate to:** `http://localhost:3000/login`

**What to Show:**
- The login page with animated left panel
- Click the "Patient" tab (it's one of the four role tabs)
- Type your existing patient credentials and click "Sign In"

**Speaking Script:**
> "First, the patient portal. The authentication system uses JWT tokens with role-based access control. I select 'Patient', enter my credentials, and sign in."

**Recording Tip:** Blur or crop out the password field if you're screen recording for security.

---

### Scene 2.2: Patient Dashboard (1:50 – 2:40)
**Navigate to:** `/patient/dashboard`

**What to Show:**
- Overview cards: Total Claims, Approved Claims, Total Reimbursed, Pending Claims
- Hover over cards to show the gradient hover effect
- The Recent Claims section on the left
- The Coverage Balance card on the right with the progress bar

**Speaking Script:**
> "Upon login, the patient lands on a comprehensive dashboard. I can immediately see my total claims, how many are approved, my total reimbursed amount, and any pending claims awaiting review.
>
> On the right, my coverage balance shows exactly how much of my annual limit I've used. Here, I've used about thirty percent of my six-hundred-thousand-rupee coverage pool. The color changes from green to amber to red as usage increases — giving patients a clear visual warning."

**Recording Tip:** Hover over the "Total Reimbursed" card and let the green gradient appear. Slowly scroll down to show the Recent Claims list.

---

### Scene 2.3: Submit a New Claim (2:40 – 3:35)
**Navigate to:** `/patient/claims`

**What to Show:**
- The claim submission form
- Select a hospital from the dropdown (e.g., "Aga Khan University Hospital")
- Pick admission and discharge dates
- Enter amount (e.g., Rs. 85,000)
- Add description (e.g., "Appendectomy procedure")
- Upload a document (select any PDF/image file from your computer)
- Click "Submit Claim"

**Speaking Script:**
> "Now, the core feature: self-service claim submission. Instead of filling paper forms, the patient selects their hospital from a dropdown of network providers, enters admission and discharge dates, the claimed amount — let's say eighty-five thousand rupees for an appendectomy — adds a brief description, and uploads supporting documents like discharge summaries or lab reports.
>
> Everything is validated client-side and server-side. I click submit, and the system immediately generates a unique claim number and queues it for insurer review."

**Recording Tip:** Use realistic dates (e.g., last week). Let the success toast/notification appear on screen before moving on.

---

### Scene 2.4: Claim History (3:35 – 3:55)
**Navigate to:** `/patient/history`

**What to Show:**
- The claims history table/list
- Filter by status: Pending, Approved, Rejected
- Search functionality
- Click into one claim to show details

**Speaking Script:**
> "Patients can view their complete claim history, filter by status, search by hospital name or claim number, and click into any claim to see full details — status, approved amount, review notes, and attached documents. Complete transparency."

**Recording Tip:** Apply the "Pending" filter, then clear it. Click one claim to open the detail modal.

---

### Scene 2.5: Smart Hospital Finder (3:55 – 4:30)
**Navigate to:** `/patient/hospitals`

**What to Show:**
- The Leaflet map loading with hospital markers
- Your current location detection (or a preset location like Karachi)
- Hospital cards with distance calculation
- The "Reimbursable" vs "Non-Reimbursable" badge
- Click on a hospital marker to show details
- Toggle filters (if available)

**Speaking Script:**
> "Before visiting a hospital, patients can use our Smart Hospital Finder. It uses Leaflet maps with geolocation to show nearby network hospitals, sorted by distance. Each hospital is tagged as reimbursable or non-reimbursable under the patient's plan.
>
> This eliminates the classic problem of a patient going to a hospital, getting treated, and later finding out their insurance doesn't cover it. Now, they know before they go."

**Recording Tip:** If geolocation doesn't work in your recording environment, zoom into Karachi manually. Click 2-3 hospital markers to show the popup details.

---

## Act 3: Hospital Operations (4:30 – 7:00)

**Switch to:** `InsureLink-Hospital` browser profile

### Scene 3.1: Login as Hospital (4:30 – 4:50)
**Navigate to:** `http://localhost:3000/login`

**What to Show:**
- Select "Hospital" tab
- Login with existing hospital credentials

**Speaking Script:**
> "Now let's switch to the hospital side. City General Hospital logs into their portal."

**Recording Tip:** A quick cut transition works well here. Or show the browser profile switch for realism.

---

### Scene 3.2: Hospital Dashboard (4:50 – 5:15)
**Navigate to:** `/hospital/dashboard`

**What to Show:**
- Four stat cards: Patients, Claims Submitted, Pending Approval, Approved
- Patient Verification input box
- Quick Actions buttons
- Recent Claims table at the bottom

**Speaking Script:**
> "The hospital dashboard gives an operational overview: patients served, claims submitted, pending insurer approvals, and approved claims. The quick actions panel lets staff jump to claim submission, view all claims, or check patient records.
>
> But the real power is in patient verification."

**Recording Tip:** Hover over each stat card briefly.

---

### Scene 3.3: Patient Verification by CNIC (5:15 – 5:40)
**Action:** In the Patient Verification box on the dashboard, type an existing employee CNIC (e.g., `42201-1234567-8`) and click "Verify Patient"

**What to Show:**
- The CNIC input field
- Success message: "Patient verified successfully!"
- If available, show the patient details that appear

**Speaking Script:**
> "When a patient walks in, the hospital staff simply enters their CNIC number. The system instantly checks if they're an insured employee or dependent, confirms their active coverage status, and shows their plan details. No phone calls to insurers. No manual lookups. Just instant verification."

**Recording Tip:** Use a CNIC from your seeded data. Let the success toast linger for 2 seconds.

---

### Scene 3.4: Register Hospital Visit (5:40 – 6:00)
**Navigate to:** `/hospital/visits` (or click "Patient Records" → Register Visit)

**What to Show:**
- Visit registration form
- Patient auto-populated from verification
- Select employee or dependent
- Enter visit details (date, reason)
- Submit

**Speaking Script:**
> "After verification, the hospital registers the visit. This creates a digital record linking the patient to the hospital and their employer. If the employee has dependents on their plan, the hospital can register visits for them too."

**Recording Tip:** Show the dependent dropdown if the employee has dependents.

---

### Scene 3.5: Submit Hospital Claim (6:00 – 6:30)
**Navigate to:** `/hospital/claims` and click "Submit New Claim" (or use the Quick Actions button)

**What to Show:**
- Claim form linked to the registered visit
- Auto-populated patient info
- Enter amount (e.g., Rs. 125,000)
- Select/enter procedure description
- Upload supporting documents
- Submit

**Speaking Script:**
> "From the registered visit, the hospital submits the insurance claim. Patient details are auto-populated, reducing data entry errors. The hospital enters the claimed amount — let's say one hundred twenty-five thousand rupees for a cardiac procedure — attaches the required medical documents, and submits.
>
> The claim immediately enters the insurer's review pipeline."

**Recording Tip:** Show the auto-populated fields clearly. This demonstrates the system integration between visits and claims.

---

### Scene 3.6: View Claims in Hospital Portal (6:30 – 7:00)
**Navigate to:** `/hospital/claims`

**What to Show:**
- Claims table with statuses
- The claim you just submitted showing "Pending"
- Action buttons: View, Edit (if pending)
- Message button for insurer communication
- Filters and search

**Speaking Script:**
> "The hospital can track all their claims in one place. Each claim shows the patient, amount, submission date, and current status. While pending, the hospital can edit the claim or message the insurer directly for clarifications. Once the insurer acts on it, the status updates in real time — which I'll show you shortly."

**Recording Tip:** Point out the "Pending" status badge. Hover over the Message button.

---

## Act 4: Insurer Decision-Making (7:00 – 10:00)

**Switch to:** `InsureLink-Insurer` browser profile

### Scene 4.1: Login as Insurer (7:00 – 7:20)
**Navigate to:** `http://localhost:3000/login`

**What to Show:**
- Select "Insurer" tab
- Login with existing insurer credentials

**Speaking Script:**
> "Now let's see what happens on the insurer side. HealthGuard Insurance logs in to manage their claims pipeline."

**Recording Tip:** Quick transition. Or show a split-second of the browser profile switch.

---

### Scene 4.2: Insurer Dashboard (7:20 – 7:55)
**Navigate to:** `/insurer/dashboard`

**What to Show:**
- Summary cards: Pending Claims, Rejected Claims, Approved Claims, Flagged Claims
- Processing overview cards: Total Claims, Approval Rate, Average Processing Time
- The Pending Claims Review table at the bottom

**Speaking Script:**
> "The insurer dashboard provides a command center view. Pending claims requiring review. Rejected claims that need follow-up. Approved and paid claims. And high-priority flagged claims that need immediate attention.
>
> Below, a processing overview shows the total claim volume, the overall approval rate, and the average processing time — currently two point one days, compared to weeks in the manual process."

**Recording Tip:** Scroll slowly from top to bottom to show all dashboard elements.

---

### Scene 4.3: Claims Pipeline — Review & Decide (7:55 – 8:35)
**Action:** In the Pending Claims Review table, click "Review" on one of the pending claims (ideally the one submitted by the hospital in Act 3)

**What to Show:**
- The Claim Action Drawer sliding in
- Claim details: patient, hospital, amount, priority
- Action buttons: Approve, Reject, Hold
- Notes textarea
- If you have the claim details modal instead, show that

**Speaking Script:**
> "Here is the claims pipeline — the heart of the platform. Each row shows the claim ID, patient name, hospital, amount, priority level, and status. I click Review on a pending claim.
>
> The action drawer opens with full claim details. I can see the patient, the hospital, the amount claimed, and any attached documents. I have three options: Approve, Reject, or place On Hold for further investigation. I can also add review notes that both the hospital and patient can see.
>
> This claim looks valid. I'll approve it for the full amount."

**Recording Tip:** Actually click Approve. Let the loading state show, then the success notification. This makes Act 5 (real-time sync) meaningful.

---

### Scene 4.4: Bulk Actions (8:35 – 8:55)
**Navigate to:** `/insurer/claims`

**What to Show:**
- The full claims list page
- Select multiple pending claims using checkboxes
- Click "Bulk Approve" (or equivalent bulk action button)
- Confirm the action

**Speaking Script:**
> "For routine, low-risk claims, insurers don't need to review one by one. They can select multiple claims and bulk-approve them, dramatically reducing processing time for straightforward cases like routine checkups or standard lab tests."

**Recording Tip:** If bulk actions aren't fully implemented in your version, skip this scene or show the checkbox selection UI.

---

### Scene 4.5: Insurance Plans Management (8:55 – 9:15)
**Navigate to:** `/insurer/plans`

**What to Show:**
- List of existing insurance plans
- Click "Create Plan" or "Edit" an existing plan
- Show the plan form: name, total coverage, covered services, per-service limits
- Save

**Speaking Script:**
> "Insurers manage their plan offerings directly in the portal. They can create new plans, set total coverage amounts, define covered services like IPD, OPD, maternity, and dental, and set per-service limits. When a corporate buys a plan for their employees, these rules automatically enforce coverage validation across the entire platform."

**Recording Tip:** Show at least one plan's details. If creating a new plan, use realistic values (e.g., "Engro Platinum, Rs. 600,000 coverage").

---

### Scene 4.6: Network Hospital Management (9:15 – 9:35)
**Navigate to:** `/insurer/hospitals`

**What to Show:**
- List of network hospitals
- Approve/reject hospital onboarding requests (if any pending)
- Show hospital details and contract status

**Speaking Script:**
> "Insurers also manage their hospital network. They can approve new hospital partnerships, view contract details, and control which hospitals are in-network versus out-of-network. This directly affects the patient hospital finder we saw earlier."

**Recording Tip:** Show a pending approval and approve it, or show the list of active network hospitals.

---

### Scene 4.7: Document Extraction (9:35 – 10:00)
**Navigate to:** `/insurer/document-extract`

**What to Show:**
- The document extractor interface
- Upload a PDF claim form
- Show the extracted fields: patient name, CNIC, amounts, dates
- Review and confirm extraction

**Speaking Script:**
> "One of our advanced features is automated document extraction. Insurers often receive claim forms as PDFs. Instead of manually typing data, they upload the PDF here, and the system extracts patient information, claimed amounts, dates, and procedure codes automatically. This reduces data entry errors and speeds up processing significantly."

**Recording Tip:** Have a sample PDF claim form ready. Show the upload progress, then the extracted fields appearing.

---

## Act 5: Real-Time Sync "Wow Moment" (10:00 – 10:45)

**This is your standout scene. Use a split screen or quick tab switch.**

### Setup:
- **Left side of screen:** `InsureLink-Hospital` profile — `/hospital/claims`
- **Right side of screen:** `InsureLink-Insurer` profile — `/insurer/dashboard` or `/insurer/claims`

### Scene 5.1: The Sync Demonstration (10:00 – 10:45)

**What to Show:**
1. Hospital side: Show the claim you submitted in Act 3, currently status "Pending"
2. Cut to Insurer side: Approve the claim (if you haven't already in Act 4)
3. Cut back to Hospital side: Refresh the page (or wait for auto-update)
4. Hospital side: The claim status changes from "Pending" to "Approved"

**Speaking Script:**
> "Now for the feature I'm most proud of: real-time synchronization.
>
> On the left is the hospital portal. On the right is the insurer portal. Look at this claim — it's currently Pending on the hospital side.
>
> * [Click Approve on insurer side] *
>
> I just approved it. Now watch the hospital side.
>
> * [Refresh hospital page or wait for update] *
>
> It updated to Approved. Instantly. No emails. No phone calls. No "check back tomorrow." The hospital knows immediately that the claim is approved, and the patient will see the same update on their dashboard. This is powered by Socket.IO, broadcasting claim status changes across all connected portals in real time."

**Recording Tip:**
- Arrange browser windows side-by-side before recording this scene
- Record this in one continuous take — the seamless transition is the "wow"
- If auto-update doesn't trigger immediately, a manual refresh is perfectly fine to demonstrate
- Speak with energy and pause after the status changes — let the moment land

---

## Act 6: Real-Time Messaging & Notifications (10:45 – 11:30)

**Continue with split screen or switch between Hospital and Insurer profiles**

### Scene 6.1: Claim-Scoped Messaging (10:45 – 11:10)

**Navigate to:** `/hospital/claims` on Hospital profile

**What to Show:**
- Click the "Message" button on a claim
- The chat drawer/modal opens
- Type a message: "Patient's CT scan report is attached. Please review."
- Send
- Switch to Insurer profile
- Show the notification bell has a red dot
- Open the notification/message panel
- Show the unread message
- Click into the claim and reply: "Received. Under review."

**Speaking Script:**
> "Communication is also real-time. The hospital has a question about a claim. They click the Message button right on the claim row and send a message.
>
> * [Send message from hospital side] *
>
> On the insurer side, a notification appears instantly. I can see the unread message count on the bell icon. I open it, read the message, and reply directly in the claim-scoped chat room.
>
> * [Reply from insurer side] *
>
> The hospital sees the reply immediately. Every message is tied to a specific claim, so there's no confusion about which case we're discussing. We also support file attachments, typing indicators, and read receipts."

**Recording Tip:** Use two windows side-by-side for maximum impact. Send the message, immediately cut to the other window showing the notification.

---

### Scene 6.2: Notifications Center (11:10 – 11:30)

**What to Show:**
- Click the notification bell icon on any portal
- Show the dropdown/panel with recent notifications
- Categories: claim status changes, new messages, dependent approvals
- Mark one as read
- Show the dismiss functionality

**Speaking Script:**
> "The notification center keeps every user informed without cluttering their workflow. Patients get notified when claims are approved. Hospitals get notified of insurer messages. Corporates get notified when employees add dependents. And everything is event-driven — powered by our NestJS EventEmitter pipeline integrated with Socket.IO."

**Recording Tip:** Show notifications on 2 different portals (e.g., Patient and Hospital) to demonstrate cross-platform delivery.

---

## Act 7: Corporate Management (11:30 – 13:30)

**Switch to:** `InsureLink-Corporate` browser profile

### Scene 7.1: Login as Corporate (11:30 – 11:50)
**Navigate to:** `http://localhost:3000/login`

**What to Show:**
- Select "Corporate" tab
- Login with existing corporate credentials

**Speaking Script:**
> "Now let's look at the corporate portal. This is where company HR departments manage employee health benefits at scale."

**Recording Tip:** Standard login transition.

---

### Scene 7.2: Corporate Dashboard (11:50 – 12:15)
**Navigate to:** `/corporate/dashboard`

**What to Show:**
- Key metrics: Active Employees, Total Coverage Pool, Used Coverage, Remaining
- Coverage utilization chart/progress
- Recent employee claims list
- Employee coverage status table

**Speaking Script:**
> "The corporate dashboard gives HR complete visibility. Active employees and dependents. Total coverage pool versus used amount. Recent claims filed by employees. And a breakdown of each employee's individual coverage utilization — so HR can identify who is approaching their limit and proactively communicate with them."

**Recording Tip:** Scroll through the employee coverage table. Hover over a progress bar.

---

### Scene 7.3: Employee Roster Management (12:15 – 12:35)
**Navigate to:** `/corporate/employees`

**What to Show:**
- Employee list with names, CNICs, departments, coverage status
- Search bar functionality
- Click "Add Employee" and show the single-add form
- Show edit/delete options

**Speaking Script:**
> "HR can view the full employee roster, search by name or CNIC, and manage individual employee records. Adding a single employee is straightforward — name, CNIC, email, department, coverage amount, and plan assignment. But what about onboarding a hundred employees at once?"

**Recording Tip:** Type a search query to filter the list. Show the add form briefly.

---

### Scene 7.4: Bulk Employee Upload (12:35 – 13:00)
**Action:** In the Employees page, click "Bulk Upload" or similar button

**What to Show:**
- The bulk upload interface
- Download template option (CSV/Excel)
- Upload a prepared CSV/Excel file with ~10-20 employee rows
- Show validation results (green = valid, red = errors)
- Confirm import
- Show success message: "15 employees imported successfully"

**Speaking Script:**
> "For bulk onboarding, HR downloads our Excel template, fills in employee data — name, CNIC, email, department, coverage — and uploads it. The system validates every row: checks for duplicate CNICs, valid email formats, and existing employees. Valid rows are imported instantly. Invalid rows are flagged with specific error messages so HR can fix and re-upload.
>
> What used to take days of manual data entry now takes under a minute."

**Recording Tip:** Have a pre-prepared CSV file ready. Show the validation step clearly — it's impressive.

---

### Scene 7.5: Dependent Approval Workflow (13:00 – 13:20)
**Navigate to:** `/corporate/dashboard` or `/corporate/employees` (wherever dependent requests appear)

**What to Show:**
- Pending dependent requests list
- Employee name, dependent name, relationship, requested date
- Click "Approve" on one request
- Click "Reject" on another (with reason)
- Show the updated status

**Speaking Script:**
> "When an employee wants to add a spouse or child to their health plan, they submit a dependent request. It comes to the corporate HR for approval. HR reviews the request, verifies the relationship documentation if needed, and either approves or rejects with a reason.
>
> This creates a proper approval chain: Employee requests → Corporate approves → Insurer validates coverage. Every stakeholder has oversight at their respective stage."

**Recording Tip:** Approve one, reject another. Show the reason input for rejection.

---

### Scene 7.6: Corporate Claims Overview (13:20 – 13:30)
**Navigate to:** `/corporate/claims`

**What to Show:**
- Read-only claims list for all employees
- Filter by employee name, status, date range
- Show totals/averages

**Speaking Script:**
> "Finally, HR gets a read-only overview of all employee and dependent claims. This helps corporates track their insurance utilization, identify frequent claimers, and negotiate better premiums with insurers based on actual data."

**Recording Tip:** Quick scroll-through. Apply one filter.

---

## Act 8: Admin Oversight & Analytics (13:30 – 16:00)

**Switch to:** `InsureLink-Admin` browser profile

### Scene 8.1: Login as Admin (13:30 – 13:50)
**Navigate to:** `http://localhost:3000/login`

**What to Show:**
- Select "Admin" tab (or login as admin if it's a separate flow)
- Login with admin credentials

**Speaking Script:**
> "Finally, the system administrator. This is the oversight layer that ties everything together."

**Recording Tip:** Standard transition.

---

### Scene 8.2: Admin Dashboard & KPIs (13:50 – 14:25)
**Navigate to:** `/admin/dashboard`

**What to Show:**
- System Overview header
- KPI Row 1: Total Claims, Pending, Approved, Rejected (with sub-details)
- KPI Row 2: Total Users, Active Employees, Coverage Pool, Utilization Rate
- Monthly Claims Trend bar chart (last 6 months)
- Processing stats: Average Processing Time, Approval Rate
- Top Hospitals by Claims table
- Coverage by Plan distribution
- Claims by Corporate table
- Recent Activity Feed

**Speaking Script:**
> "The admin dashboard is a real-time command center. Total claims in the system — and the total value claimed. Breakdown by status: pending, approved, rejected. User counts across all portals. Coverage analytics: total pool, used amount, utilization rate.
>
> The monthly trend chart shows claim volume over the last six months — useful for predicting peak periods like flu season or post-holiday spikes. Below that, top hospitals by claim amount, coverage distribution by plan, and claims volume per corporate client.
>
> Everything an administrator needs to run the platform efficiently."

**Recording Tip:** This is information-dense. Scroll slowly. Pause on each section for 3-4 seconds.

---

### Scene 8.3: User Management (14:25 – 14:50)
**Navigate to:** `/admin/users`

**What to Show:**
- User list table with names, emails, roles, organizations, status
- Search functionality
- Click "Create User" and show the form
- Show edit user modal
- Show deactivate/activate toggle

**Speaking Script:**
> "Admins have full user lifecycle management. They can create users for any role, assign them to organizations, edit their details, deactivate accounts, and perform bulk operations. This is especially useful during corporate onboarding or when a hospital partnership ends."

**Recording Tip:** Create a dummy user (don't save if you don't want to), or just show the form fields.

---

### Scene 8.4: Broadcast Notifications (14:50 – 15:10)
**Navigate to:** `/admin/settings` or `/admin/users` (wherever broadcast feature is)

**What to Show:**
- Broadcast notification composer
- Target audience selector: All Users, All Patients, All Hospitals, etc.
- Compose a message: "System maintenance scheduled for Sunday 2 AM."
- Send
- Show the notification appears on another portal

**Speaking Script:**
> "Admins can send targeted broadcast notifications. System maintenance alerts to all users. Policy updates to all insurers. New hospital network additions to all patients. The message reaches the target audience instantly via our notification pipeline."

**Recording Tip:** If broadcast isn't fully wired, show the UI and describe the flow.

---

### Scene 8.5: Fraud Monitoring (15:10 – 15:35)
**Navigate to:** `/admin/fraud`

**What to Show:**
- Fraud dashboard with flagged anomalies
- Categories: Duplicate Amounts, High-Frequency Claimers, High-Value Claims
- Click into a flagged case to see details
- Show risk score or reason for flagging

**Speaking Script:**
> "Fraud detection is critical in insurance. Our system automatically flags suspicious patterns: duplicate claim amounts from the same patient, unusually high-frequency claims, and claims exceeding normal value thresholds for a given procedure.
>
> Here, the system flagged a patient who submitted three claims in one week for similar amounts. The admin can drill down, review the details, and escalate to the insurer for investigation. This proactive detection saves insurers millions in fraudulent payouts."

**Recording Tip:** If your fraud dashboard is populated, show actual flagged data. If not, describe the concept while showing the UI layout.

---

### Scene 8.6: Audit Logs (15:35 – 16:00)
**Navigate to:** `/admin/audit-logs`

**What to Show:**
- Audit log table: Action (Create/Update/Delete), User, Entity Type, Timestamp
- Click into a log entry to see field-level diffs
- Show CSV export button
- Export a sample report

**Speaking Script:**
> "Compliance and accountability are non-negotiable in healthcare finance. Every create, update, and delete operation across the entire platform is logged with field-level diffs.
>
> For example, if an insurer changes a claim status from Pending to Approved, the log captures exactly who made the change, when, and what the old and new values were. Admins can search, filter, and export these logs to CSV for regulatory audits or internal reviews.
>
> This level of auditability simply doesn't exist in Pakistan's current manual insurance processes."

**Recording Tip:** Click one log entry to show the detailed diff view. Then click "Export CSV" and show the downloaded file.

---

## Act 9: Closing (16:00 – 17:00)

### Scene 9.1: Return to Landing Page (16:00 – 16:30)
**Navigate to:** `http://localhost:3000/`

**What to Show:**
- The landing page hero section again
- Slowly scroll down to show the feature cards and stats

**Speaking Script:**
> "To summarize: InsureLink digitizes the entire health insurance claim lifecycle. Patients submit claims and track them in real time. Hospitals verify patients instantly and manage visits digitally. Insurers process claims through an intelligent pipeline with fraud detection. Corporates manage employee benefits at scale. And administrators oversee everything with real-time analytics and audit trails.
>
> We replaced phone calls and Excel sheets with a unified, real-time, secure platform."

**Recording Tip:** Slow, deliberate scroll. Let the landing page animations play. This brings the story full circle.

---

### Scene 9.2: Tech Stack & Project Details (16:30 – 17:00)
**Option A:** Show a static slide (PowerPoint/Canva) with tech stack
**Option B:** Speak over the landing page or a code editor showing the project structure

**What to Say:**
> "InsureLink is built with a modern, scalable tech stack. The frontend uses Next.js 16 with the App Router, React 19, TypeScript, and Tailwind CSS 4. The backend is NestJS 11 with a modular domain-driven architecture — twelve modules including Auth, Claims, Messaging, Analytics, and Audit.
>
> We use Prisma ORM 7 with PostgreSQL for type-safe database access. Socket.IO powers real-time claim synchronization and messaging. Supabase Storage handles document uploads. And Leaflet provides the geolocation-based hospital finder.
>
> The platform features over fifty REST APIs, JWT-based authentication with role guards, rate limiting, field-level audit logging, and event-driven notifications. Every design decision prioritized security, scalability, and real-time collaboration.
>
> Thank you. I'd be happy to take any questions."

**Recording Tip:** If showing code, zoom into the `server/src/modules` folder structure briefly. If showing a slide, keep it clean with logos/icons for each technology.

---

## 🎥 Screen Recording Best Practices

### General Tips
1. **Cursor highlighting:** Use a tool like ScreenCast-O-Matic, OBS, or Windows PowerToys to highlight your cursor
2. **Zoom in:** For forms and tables, use Ctrl+Plus to zoom the browser to 110-125% before recording
3. **Hide bookmarks bar:** Press Ctrl+Shift+B to hide it
4. **Hide URL bar distractions:** Use fullscreen (F11) if comfortable, or just keep the tab bar clean
5. **Consistent theme:** Keep all portals in light mode for consistency

### Per-Scene Recording Notes
| Act | Recommended Zoom | Special Setup |
|-----|-----------------|---------------|
| 1 | 100% | Let animations play |
| 2 | 110% | Focus on form fields |
| 3 | 110% | Show verification clearly |
| 4 | 110% | Table rows must be readable |
| 5 | 100% | Side-by-side windows |
| 6 | 110% | Split screen for chat |
| 7 | 110% | Show CSV validation |
| 8 | 100% | Information-dense, normal zoom |
| 9 | 100% | Clean landing page view |

### Audio Tips
- Record in a quiet room
- Use a decent microphone (even phone earphones work)
- Speak slightly slower than normal conversation
- Pause 1-2 seconds after major transitions
- If you stumble, pause, take a breath, and repeat the line — you can edit later

---

## 🚨 Troubleshooting During Recording

| Problem | Quick Fix |
|---------|-----------|
| Page loads slowly | Pause recording, refresh, resume |
| Socket.IO doesn't auto-update | Manual refresh is fine — say "and on refresh, we see the update" |
| Form validation fails | Use data you know works; prepare backup test accounts |
| Notification doesn't appear | Check that backend is running; if not, describe what would happen |
| Map doesn't load | Zoom manually to Karachi; describe geolocation feature |
| Claim not in table | Check you used the right hospital/insurer pairing in your data |
| Session expires | Re-login quickly; keep credentials in a notepad |

---

## 📝 Quick Reference: Login Credentials

Fill this in with your actual seeded data before recording:

| Portal | Email | Password | Organization |
|--------|-------|----------|--------------|
| Patient | _______________ | _______________ | _______________ |
| Hospital | _______________ | _______________ | _______________ |
| Insurer | _______________ | _______________ | _______________ |
| Corporate | _______________ | _______________ | _______________ |
| Admin | _______________ | _______________ | System Admin |

---

## ✅ Post-Recording Checklist

- [ ] Watch the full recording once for obvious errors
- [ ] Check audio levels — voice should be clear, not too quiet or distorted
- [ ] Trim long loading pauses (keep natural pauses for comprehension)
- [ ] Add captions/subtitles if required by your university
- [ ] Export in MP4 format, 1080p, H.264 codec
- [ ] Filename: `InsureLink_FYP_Demo_2026.mp4`
- [ ] Backup the raw recording before editing

---

**Good luck with your demo! You've built an impressive full-stack platform. Show it with confidence.**

*InsureLink Demo Script — Final Year Project 2026*
