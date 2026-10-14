# PRODUCT.md — Canonical Product Requirements for ClaimIt

This document defines the functional scope, product workflows, user roles, business rules, and product lifecycle of the **ClaimIt** campus lost-and-found web application.

---

## 1. Product Purpose & Target Audience

ClaimIt is a centralized web platform designed for university campuses to streamline the recovery, reporting, verification, and return of misplaced items. It replaces disorganized social media posts, physical lost-and-found boxes, and manual paper logs with a transparent, structured system.

### Intended User Personas
1. **Students**:
   - Primary campus population.
   - Report lost items (e.g., student IDs, electronics, water bottles, keys, textbooks).
   - Report found items spotted or turned in.
   - Search and browse campus listings with filters.
   - Submit ownership claims with detailed evidence.
   - Chat with finders or reporters to arrange handover.
   - Track submitted reports and claims in personalized dashboards.
2. **Faculty & Campus Staff**:
   - Professors, lecturers, department secretaries, athletics coaches, and security guards.
   - Register with employee credentials; requires administrative vetting before full access.
   - Log items found in lecture halls, laboratories, dining halls, or campus grounds.
   - Hand over items to campus security or manage direct verification.
3. **Administrators (Campus Security & Student Affairs)**:
   - Responsible for overall lost-and-found logistics, policy compliance, and user verification.
   - Approve or decline new faculty registration requests.
   - Monitor live platform activity and metrics via the Admin Dashboard.
   - Resolve disputes, suspend abusive accounts, and delete fraudulent listings.
   - Maintain platform taxonomies (categories, academic programs, campus departments).
   - Audit system actions through immutable activity logs.

---

## 2. Roles, Permissions & Access Matrix

| Feature / Action | Student | Faculty (Active) | Faculty (Pending) | Admin |
| :--- | :---: | :---: | :---: | :---: |
| Self-Registration | Yes | Yes | — | By Admin Only |
| Initial Account Status | `Active` | `Active` (after approval) | `Pending approval` | `Active` |
| View Public Listings / Browse | Yes | Yes | Read-Only / Restricted | Yes |
| Report Lost or Found Item | Yes | Yes | No | Yes |
| Submit Claim / Found Match | Yes | Yes | No | Yes |
| Direct Messaging on Claim | Yes | Yes | No | Yes |
| Manage Personal Reports & Claims | Yes | Yes | No | Yes |
| Admin Dashboard & Metrics | No | No | No | Yes |
| Approve / Decline Faculty Accounts | No | No | No | Yes |
| Suspend / Reactivate Users | No | No | No | Yes |
| Delete / Force-Resolve Any Listing | No | No | No | Yes |
| Manage Lists (Categories, Programs) | No | No | No | Yes |
| View System Activity Audit Logs | No | No | No | Yes |

---

## 3. Core Workflows & Business Rules

### 3.1 Authentication & Account Lifecycle

#### A. Student Registration
- **Fields**: Full Name, Email Address, Password (>= 8 characters), School ID Number, Program (Degree), Year Level, Section.
- **Rule**: Upon valid submission, account is created in `Active` status immediately.

#### B. Faculty Registration
- **Fields**: Full Name, Email Address, Password (>= 8 characters), Faculty/Employee ID Number, Department.
- **Rule**: Account is created in `Pending approval` status. Faculty cannot create listings or initiate claims until an administrator approves their request.

#### C. Administrative Account Review
- Admins inspect pending faculty requests in the User Management subtab.
- **Approve**: Account status transitions to `Active`. User receives approval notification and full platform privileges.
- **Decline**: Admin enters an optional decline reason. Account is marked `Declined`.

#### D. Account Suspension & Reactivation
- Admins can suspend any user violating campus policies (e.g., fraudulent claims, abusive messaging).
- Suspended users cannot log in, create listings, submit claims, or send messages.
- Admins can restore a suspended user to `Active`.

#### E. Password Reset Flow
- User submits registered email address.
- A 6-digit verification code is generated with a 10-minute expiry window.
- User enters the 6-digit code.
- User enters and confirms a new password (>= 8 characters).
- Upon success, all existing auth sessions are refreshed.

#### F. Administrator Provisioning & Single Source of Truth
- **Single Source of Truth**: Firebase Authentication Custom Claims (`request.auth.token.role` and `request.auth.token.status`) serve as the cryptographic authority for all Security Rules and Cloud Functions. The Firestore `users/{uid}` document reflects this authority and is synchronized via trusted Admin SDK calls.
- **No Self-Registration**: Public self-registration for administrators is strictly prohibited. Client requests requesting `role: 'admin'` are rejected.
- **Initial Admin Provisioning**: Initial administrators must be provisioned via the secure server-side CLI tool (`node scripts/provision-admin.js <email_or_uid>`) executed by authorized infrastructure personnel with Admin SDK credentials.
- **Subsequent Admin Management**: Existing verified administrators can grant or revoke admin privileges using the trusted `setAdminRole` Cloud Function.
- **No Backdoors**: There are no hidden frontend routes, secret URL parameters, or hardcoded passwords for administrator elevation.

---


### 3.2 Report Lifecycle (Lost & Found Listings)

#### A. Report Types
1. **LOST**: The reporter misplaced an item and is seeking its recovery.
2. **FOUND**: The reporter found an item and is holding it or has deposited it at a campus security desk.

#### B. Report Creation — [IMPLEMENTED]
- **Fields**:
  - `reportType` / `type`: Normalized to `'LOST'` or `'FOUND'`.
  - `title` / `itemName`: Item name or title (required string, 2–120 characters).
  - `category`: Taxonomy reference (required string, e.g. Electronics, Personal Items, Keys & Accessories).
  - `date`: Date item was lost or found (YYYY-MM-DD; cannot be in the future).
  - `location`: Specific campus landmark or room (required string, 2–200 characters).
  - `description`: Detailed physical description, distinguishing marks, stickers (required string, 5–2000 characters).
  - `imageUrl`: Optional download URL from Firebase Storage.
  - `imageStoragePath`: Optional storage reference path (`reports/{reportId}/{fileName}`).
- **Server-Assigned Fields**:
  - `reporterUid`: Verified `request.auth.uid` from authenticated token (cannot be client-spoofed).
  - `reporterName`: Derived from user profile in Firestore.
  - `reporterRole`: Derived from authenticated account role ('Student' | 'Faculty' | 'Admin').
  - `reporterProgramOrDept`: Derived from user academic program or department.
  - `ticketNumber`: Generated unique display code formatted as `R-xxxx` (e.g., `R-1072`).
  - `status`: Initialized to `'Active'`.
  - `claimsCount`: Initialized to `0`.
  - `createdAt` & `updatedAt`: Server-controlled Firestore timestamps.

#### C. Report Status Machine — [IMPLEMENTED]
- `Active`: Newly published listing visible in Browse Items and My Reports.
- `Pending Claim`: A FOUND item has at least one active ownership claim under review (Prompt 7).
- `Pending Match`: A LOST item has at least one matching found report under review (Prompt 7).
- `Resolved`: Item has been successfully verified, returned, and handed over (Prompt 7).
- `Closed` / `Withdrawn`: Listing retired by the reporter (via `CloseThisReportModal`) or closed by an administrator. Permanently removed from active browse catalog while preserving audit history.

#### D. Edit & Deletion Rules — [IMPLEMENTED]
- **Creator Edit Authority**: A report creator can only edit permitted content fields (`title`, `category`, `date`, `location`, `description`, `imageUrl`, `imageStoragePath`). They cannot alter `reporterUid`, `ticketNumber`, `type`, `createdAt`, or `claimsCount`.
- **Soft-Close / Retirement**: A report creator can soft-close their active report, setting status to `'Closed'` with a recorded reason (e.g., item recovered independently).
- **Deletion Integrity**: Ordinary users cannot hard-delete reports, ensuring claim history and campus safety records are not orphaned. Only administrators may permanently delete a listing from Firestore and clean up its Storage image.

---

### 3.3 Claim & Ownership Verification Workflow

ClaimIt supports two directional verification workflows depending on listing type:

#### Scenario 1: Claiming a FOUND Item ("Claim this item")
1. A student browses a FOUND listing (e.g., "Black Leather Bifold Wallet").
2. User clicks "Claim Item", opening the Action Modal.
3. User submits proof of ownership:
   - Secret/unique identifiers (e.g., scratches, engraving, wallet contents, wallpaper).
   - Optional evidence attachments (e.g., receipts, photos, screenshots; up to 3 files, <= 10MB each).
4. System creates a claim ticket (`#CLM-xxxx`) linked to the report.
5. Report status moves from `Active` to `Pending Claim`.
6. Report owner receives a notification and reviews the claim in `ClaimMatchVerificationModal`.

#### Scenario 2: Reporting a Match on a LOST Item ("Found Item Report")
1. A campus member spots an item matching a posted LOST report.
2. User clicks "Report Found", opening the Action Modal.
3. User specifies where the item was spotted or turned in (e.g., "Deposited at Campus Security Desk Room 210"), along with optional photo attachments.
4. System creates a match ticket (`#FND-xxxx`) linked to the lost report.
5. Report status moves from `Active` to `Pending Match`.
6. Lost report owner receives a notification to verify the match.

#### Verification & Resolution Actions
- **In-Modal Direct Messaging**: Reporter and claimant communicate directly inside the verification modal to clarify details or schedule physical handover.
- **Approve Claim/Match**:
  - Report owner confirms ownership.
  - Claim status updates to `Approved`.
  - Report status updates to `Resolved`.
  - Handover location and pickup guidelines are displayed.
  - All other pending claims for that report are marked `Declined`.
- **Decline Claim**:
  - Report owner rejects insufficient or incorrect proof.
  - Claim status updates to `Declined`.
  - If no other pending claims remain, report status reverts to `Active`.
- **Withdraw Claim**:
  - Claimant can withdraw a pending claim at any time from `My Claims`.
  - Claim status updates to `Withdrawn`.

---

### 3.4 Direct Messaging & Notifications

#### Direct Messaging
- Scoped strictly to an active Claim or Match verification ticket.
- Avoids exposing private phone numbers or personal social media handles.
- Includes sender name, timestamp, and message body with campus safety reminder banner.

#### Notifications System
- Triggers for:
  - New claim/match submitted on a user's report.
  - Claim approved, declined, or withdrawn.
  - New message received in a claim thread.
  - Faculty account approved or declined by Admin.
- Provides unread count badge, mark as read, and direct navigation to the relevant claim or report.

---

### 3.5 Administrative Workflows

1. **Dashboard Overview**: Real-time counter metrics for Total Accounts, Student Count, Faculty Count, Awaiting Faculty Approvals, and Suspended Accounts.
2. **User Management**: Searchable, filterable list of all registered users. Approve/Decline pending faculty, view profile details, suspend or reactivate accounts, manually register accounts.
3. **Reports Management**: Searchable tabular view of all campus listings with filters for status, category, type, and reporter role. View report details, download CSV exports, change status, or delete fraudulent listings.
4. **Manage Lists (Taxonomy Control)**: Add, edit, or delete items in:
   - Report Categories (e.g., Electronics, Bags & Wallets, IDs & Campus Cards).
   - Academic Programs (e.g., BS Computer Science, BS Nursing).
   - Academic Departments (e.g., College of Information & Computing).
5. **Activity Logs**: Immutable audit log of security events (e.g., account suspensions, status changes, manual deletions, registrations).

---

## 4. Confirmed Functionality vs Planned Backend Implementation

| Feature Area | Current State in Repository | Planned Backend Milestone |
| :--- | :--- | :--- |
| **Authentication** | **Implemented** (Firebase Auth, AuthContext, session restore, password reset) | Complete (Milestone 3) |
| **User Persistence** | **Implemented** (Firestore `users/{uid}`, real-time subscription, protected fields) | Complete (Milestone 3) |
| **Report Creation** | Local state + `FileReader` dataURL preview; no storage | Firestore `reports` + Storage bucket uploads (Prompt 6) |
| **Browse & Filter** | In-memory array (`DEFAULT_BROWSE_ITEMS`) filtered via `useMemo` | Firestore queries with indexed filters (Prompt 6) |
| **Claims & Matches** | In-memory arrays (`DEFAULT_CLAIMS`, `DEFAULT_REPORTS`) | Firestore `claims` subcollection with atomic transactions (Prompt 7) |
| **Messaging** | In-memory state array in verification modal | Firestore real-time `messages` subcollection (`onSnapshot`) (Prompt 8) |
| **Notifications** | Static array in `Notifications.jsx` | Firestore `notifications` collection with unread counters (Prompt 8) |
| **Admin Operations** | Local React state mutations; resets on page reload | Cloud Functions 2nd Gen with Firebase Admin SDK (Prompt 9) |
| **Taxonomies** | Hardcoded `INITIAL_DATA` in `ManageLists.jsx` | Firestore `taxonomies` collection (Prompt 9) |
| **Audit Logs** | Baseline collection in `registerUser`; UI uses mock | Full trigger logging (Prompt 9) |

---

## 5. Assumptions and Unresolved Product Decisions

1. **Automated vs Manual Matching**: Current design relies on human-driven matching (users submit a "Found Report" directly against an existing "Lost Report"). An unresolved future enhancement is AI-assisted or vector-based automated recommendation matching based on item attributes.
2. **Email Notification Service**: In production, email notifications (e.g., SendGrid or Firebase Extensions) should notify users when offline. For local development and early milestones, in-app notifications and emulator logs will be prioritized.
3. **Proof Privacy**: Claim proof currently contains sensitive information (student ID numbers, personal receipts). The product requirement dictates that claim proof must strictly remain private between the claimant, the report poster, and admins.
