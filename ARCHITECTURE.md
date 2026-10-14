# ARCHITECTURE.md — Technical Architecture & Infrastructure Specification for ClaimIt

This document outlines the system architecture, Firebase resource topology, data schemas, security rules, and infrastructure boundaries for **ClaimIt**.

---

## 1. System Topology & Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                            │
│  React 19.2 (Vite) + Tailwind CSS + Lucide Icons + Firebase Web SDK    │
└────────────┬─────────────────────────────┬─────────────────────────────┘
             │ (Auth Tokens / SDK)         │ (Direct Storage Uploads)
             ▼                             ▼
┌─────────────────────────┐   ┌──────────────────────────────────────────┐
│ Firebase Authentication │   │             Firebase Storage             │
│ Custom Claims (RBAC)    │   │  /reports/{reportId}/*                   │
└────────────┬────────────┘   │  /claims/{claimId}/*                     │
             │                │  /users/{uid}/*                          │
             │                └──────────────────────────────────────────┘
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FIREBASE CLOUD FUNCTIONS                        │
│                   (2nd Gen Node.js 22 / TypeScript)                    │
│                                                                        │
│  - HTTPS Callable Functions (Privileged Operations)                    │
│    • registerUser, manageAccountStatus, reviewClaim                    │
│  - Eventarc / Firestore Triggers (Background)                          │
│    • onReportCreated, onClaimSubmitted, onClaimStatusChanged           │
│  - Firebase Admin SDK (Trusted Server Context)                         │
└────────────┬───────────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            CLOUD FIRESTORE                             │
│                                                                        │
│  users/{uid}                                                           │
│  reports/{reportId}                                                    │
│    └── claims/{claimId}                                                │
│          └── messages/{messageId}                                      │
│  taxonomies/{type}/items/{itemId}                                      │
│  notifications/{notificationId}                                        │
│  activity_logs/{logId}                                                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Status of Architecture: Implemented vs. Proposed

| Layer / Component | Status in Current Repository | Target Architecture |
| :--- | :--- | :--- |
| **Frontend Framework** | **Implemented** (React 19.2 + Vite 8 in `/client`) | Maintained as-is |
| **Styling & Assets** | **Implemented** (Tailwind CDN, CSS variables, Lucide icons) | Maintained as-is |
| **Client Firebase SDK** | **Configured locally** (`client/src/firebase/config.js` singleton) | Web SDK v11 modular; connects to Emulators |
| **Authentication** | **Implemented** (Firebase Auth, Custom Claims, AuthContext, session restore) | Production Firebase Auth |
| **Cloud Firestore** | **Implemented for Users & Reports** (`users/{uid}`, `reports/{reportId}` secured by `firestore.rules`) | Cloud Firestore (Claims in Prompt 7) |
| **Firebase Storage** | **Implemented & Secured** (`avatars/{uid}/*`, `reports/{reportId}/*` image MIME & 10MB bounds) | Cloud Storage |
| **Cloud Functions** | **Implemented** (`/functions` TypeScript 2nd Gen, `registerUser`, `manageAccountStatus`, `setAdminRole`, `createReport`, `updateReport`, `closeReport`, `deleteReport`) | 2nd Gen Functions (Claims in Prompt 7) |
| **Security Rules** | **Implemented & Verified** (`firestore.rules`, `storage.rules`, 22 test suites passed) | Safe-by-default; field-level immutability enforced |
| **Emulator Suite** | **Configured locally** (`firebase.json` Auth, Firestore, Storage, Functions, UI) | Local offline emulation for development |

---

## 3. Local Firebase Architecture & Directory Structure

```
claimit/
├── firebase.json               # Firebase CLI config (Firestore, Storage, Functions, Emulators)
├── .firebaserc                 # Project aliases (default: claimit-campus)
├── firestore.rules             # Safe-by-default Firestore access controls
├── firestore.indexes.json      # Composite query indexes for reports & claims
├── storage.rules               # Safe-by-default Storage upload constraints
├── .env.example                # Environment variables template (public vs privileged)
├── client/                     # Vite + React SPA
│   └── src/
│       └── firebase/
│           └── config.js       # Client SDK singleton with auto emulator connection
└── functions/                  # Cloud Functions 2nd Gen (TypeScript)
    ├── package.json            # Node.js 22 runtime dependencies (firebase-admin, firebase-functions)
    ├── tsconfig.json           # ES2022 / NodeNext compiler settings
    └── src/
        ├── index.ts            # Entry point exporting healthCheck function
        ├── config/
        │   └── firebase.ts     # Firebase Admin SDK singleton (adminAuth, adminDb, adminStorage)
        └── utils/
            ├── errors.ts       # Standard AppError and handleFunctionError utilities
            └── validation.ts   # Input assertion and validation helpers
```

### Emulator Port Allocations
- **Authentication**: `localhost:9099`
- **Cloud Functions**: `localhost:5001`
- **Cloud Firestore**: `localhost:8080`
- **Cloud Storage**: `localhost:9199`
- **Emulator Suite UI**: `http://localhost:4000`

---

## 4. Cloud Firestore Data Schema

### 3.1 `users/{uid}`
Stores detailed user profiles linked to Firebase Authentication accounts.

```typescript
interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: 'student' | 'faculty' | 'admin';
  status: 'Active' | 'Pending approval' | 'Suspended';
  avatarUrl?: string | null;
  // Student attributes:
  studentId?: string;
  program?: string;
  yearLevel?: string;
  section?: string;
  // Faculty attributes:
  facultyId?: string;
  department?: string;
  position?: string;
  // Audit timestamps:
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  approvedAt?: FirebaseFirestore.Timestamp | null;
  approvedBy?: string | null;
}
```

### 3.2 `reports/{reportId}`
Top-level collection for all Lost and Found listings.

```typescript
interface ReportItem {
  id: string;               // Document ID, e.g. "R-1072"
  ticketNumber: string;     // Unique display ticket
  title: string;            // e.g., "Apple AirPods Pro"
  category: string;         // e.g., "Electronics"
  type: 'LOST' | 'FOUND';   // Listing classification
  status: 'Active' | 'Pending Claim' | 'Pending Match' | 'Resolved' | 'Closed';
  date: string;             // Date item lost or found (YYYY-MM-DD)
  location: string;         // Campus location description
  description: string;      // Full physical item description
  imageUrl?: string | null; // Download URL from Firebase Storage
  imagePath?: string | null;// Storage reference path
  reporterUid: string;      // Foreign key to users/{uid}
  reporterName: string;     // Denormalized name for list view
  reporterRole: 'Student' | 'Faculty' | 'Admin';
  reporterProgramOrDept: string;
  claimsCount: number;      // Denormalized counter of active claims
  resolvedClaimId?: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 3.3 `reports/{reportId}/claims/{claimId}`
Subcollection containing claims filed against a specific report.

```typescript
interface Claim {
  id: string;
  ticketId: string;          // e.g., "#CLM-8492" or "#FND-5912"
  reportId: string;          // Parent report ID
  claimantUid: string;       // Foreign key to users/{uid}
  claimantName: string;
  claimantRole: string;
  mode: 'claim' | 'found_report';
  status: 'Pending' | 'Approved' | 'Declined' | 'Withdrawn';
  proofDetails: string;      // Proof description or location spotted
  attachmentUrls: string[];  // Evidence image URLs in Storage
  attachmentPaths: string[]; // Storage paths for deletion lifecycle
  declineReason?: string | null;
  handoverLocation?: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 3.4 `reports/{reportId}/claims/{claimId}/messages/{messageId}`
Subcollection representing the private chat thread between claimant and reporter.

```typescript
interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderRole: string;
  text: string;
  attachmentUrl?: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  isRead: boolean;
}
```

### 3.5 `taxonomies/{type}/items/{itemId}`
Admin-configurable list collections where `type` is one of `categories`, `programs`, or `departments`.

```typescript
interface TaxonomyItem {
  id: string;        // e.g., "rc-1", "pr-2", "dp-3"
  name: string;      // e.g., "Electronics", "BS Computer Science"
  status: 'active' | 'archived';
  sortOrder?: number;
  createdAt: FirebaseFirestore.Timestamp;
}
```

### 3.6 `notifications/{notificationId}`
Global notifications collection with user indexing.

```typescript
interface NotificationItem {
  id: string;
  recipientUid: string;
  title: string;
  description: string;
  ticketId?: string;
  reportId?: string;
  claimId?: string;
  type: 'claim_received' | 'claim_status' | 'account_status' | 'new_message';
  unread: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}
```

### 3.7 `activity_logs/{logId}`
System-wide audit trail of administrative and lifecycle events.

```typescript
interface ActivityLog {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetEntity: string;      // e.g., "report:R-1042", "user:u-1"
  timestamp: FirebaseFirestore.Timestamp;
  metadata?: Record<string, any>;
}
```

---

## 5. Firebase Storage Organization

Files are segregated by domain with predictable access controls:

```
storage-bucket/
├── reports/
│   └── {reportId}/
│       └── item_image_{timestamp}.{ext}
├── claims/
│   └── {claimId}/
│       ├── evidence_1_{timestamp}.{ext}
│       ├── evidence_2_{timestamp}.{ext}
│       └── evidence_3_{timestamp}.{ext}
└── avatars/
    └── {uid}/
        └── profile_{timestamp}.{ext}
```

---

## 6. Security Rules Strategy

### 6.1 Cloud Firestore (`firestore.rules`) Principles
- **Default Deny**: `match /{document=**} { allow read, write: if false; }`.
- **User Profiles (`/users/{uid}`)**:
  - Read: Authenticated users can read basic profile info.
  - Write: Users can update their own editable profile fields (`fullName`, `avatarUrl`, `section`).
  - Restricted: `role`, `status`, `approvedAt` can NEVER be written by normal users; only Cloud Functions with Admin SDK.
- **Reports (`/reports/{reportId}`)**:
  - Read: Public or authenticated users can read all active listings.
  - Create: Authenticated users with `status == 'Active'` can create listings.
  - Update: Only the `reporterUid` or an admin can edit listing details.
  - Delete: Only the `reporterUid` or an admin can delete listings.
- **Claims (`/reports/{reportId}/claims/{claimId}`)**:
  - Read: Strictly limited to the `claimantUid`, the parent `report.reporterUid`, and admins.
  - Create: Authenticated active users (not the original reporter) can submit a claim.
  - Update: Handled via Cloud Function or strict state transitions (withdraw by claimant, review by reporter).
- **Messages**:
  - Read/Write: Strictly limited to participants (`claimantUid` and `reporterUid`) and admins.
- **Taxonomies**:
  - Read: Publicly readable by all authenticated users.
  - Write: Admins only.
- **Activity Logs**:
  - Read: Admins only.
  - Write: Denied to all clients (written solely by Cloud Functions using Admin SDK).

### 6.2 Firebase Storage (`storage.rules`) Principles
- **Item Photos (`/reports/{reportId}/*`)**:
  - Read: Public / authenticated read.
  - Write: Authenticated active users. Max size 10MB. MIME type matching `image/(jpeg|png|webp)`.
- **Claim Evidence (`/claims/{claimId}/*`)**:
  - Read: Restricted to claimant, report poster, and admins.
  - Write: Restricted to claimant. Max 3 files, max 10MB each.
- **Avatars (`/avatars/{uid}/*`)**:
  - Read: Public / authenticated read.
  - Write: Owner only (`request.auth.uid == uid`). Max size 5MB.

---

## 7. Cloud Functions & Serverless Boundaries

Implemented in TypeScript under Node.js 22 (Firebase Functions 2nd Gen):

1. **`registerUser` (HTTPS Callable)**: Handles user account provisioning, role/status claim stamping, and initial document creation.
2. **`manageAccountStatus` (HTTPS Callable)**: Admin endpoint for approving/declining faculty and suspending accounts.
3. **`reviewClaim` (HTTPS Callable)**: Executes the atomic transaction resolving a report, approving the winning claim, and declining competing claims.
4. **`onReportCreated` (Firestore Trigger)**: Logs audit event and validates content.
5. **`onClaimSubmitted` (Firestore Trigger)**: Dispatches in-app notification to report owner and logs activity.
6. **`onMessageSent` (Firestore Trigger)**: Updates recipient's unread message counter and dispatches notification.

---

## 8. Architectural Decision Records (ADRs)

### ADR-01: Modular Subcollections for Claims and Messages vs. Root Collections
- **Decision**: Store `claims` as subcollections of `reports`, with `messages` as subcollections of `claims`.
- **Rationale**: Natural containment, simplified security rules inheritance, and atomic cascading deletions. Firestore Collection Group queries (`collectionGroup('claims')`) will be used for claimant-centric views (`My Claims`).

### ADR-02: Cloud Functions 2nd Gen with Firebase Admin SDK for State Transitions
- **Decision**: Mutating complex multi-document states (e.g. claim approval resolving a report) must execute in Cloud Functions rather than multi-path client writes.
- **Rationale**: Guarantees transaction isolation, eliminates race conditions between simultaneous claimants, enforces business invariants server-side, and produces reliable audit logs.

### ADR-03: Firebase Custom Claims for Role-Based Access Control
- **Decision**: User role (`admin`, `faculty`, `student`) and status (`active`, `pending_approval`, `suspended`) are mirrored in Auth Custom Claims.
- **Rationale**: Evaluated instantly in Security Rules (`request.auth.token.role`) without requiring extra Firestore document reads, reducing billing costs and latency while preventing client-side spoofing.
