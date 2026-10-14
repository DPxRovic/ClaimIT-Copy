# DESIGN.md — Backend Interaction, Contracts & Behavior Design for ClaimIt

This document specifies the backend contracts, callable function interfaces, validation rules, state machines, error standards, and edge-case handling for the **ClaimIt** application.

---

## 1. Backend Service Boundary & Architecture Standards

All client-to-backend operations follow one of three architectural patterns:
1. **Direct Firestore Operations with Security Rules**: High-frequency reads (browsing listings, reading user profiles, real-time message streams) governed by granular `firestore.rules`.
2. **Callable Cloud Functions (2nd Gen)**: Privileged, multi-document, or state-machine mutating operations (user registration with role claims, claim approval/declining, admin account approval/suspension, listing deletion) implemented via `httpsCallable`.
3. **Storage Direct Uploads**: File and image binary uploads handled via Firebase Storage SDK, authorized by `storage.rules`.

---

## 2. Standardized Error Handling Contract

All Cloud Functions and API interactions must adhere to a standardized error format:

```typescript
interface ServiceErrorResponse {
  code: string;            // Standard Firebase Functions error code
  message: string;         // User-friendly descriptive error message
  details?: {
    field?: string;        // Validation field responsible for error
    reason?: string;       // Detailed error reason
    timestamp: string;     // ISO 8601 timestamp
  };
}
```

### Canonical Error Codes
| Error Code | HTTP Status | Meaning |
| :--- | :---: | :--- |
| `unauthenticated` | 401 | User must be logged in with a valid Firebase ID token. |
| `permission-denied` | 403 | User does not possess the required role (e.g., student attempting admin action). |
| `invalid-argument` | 400 | Payload failed schema validation (missing fields, bad formats, file too large). |
| `not-found` | 404 | Target report, claim, user, or conversation does not exist. |
| `already-exists` | 409 | Duplicate entity (e.g., email already registered, ticket collision). |
| `failed-precondition`| 412 | Invalid state transition (e.g., approving an already resolved report). |
| `resource-exhausted` | 429 | Rate limit reached (e.g., excessive claim submissions or message spam). |

---

## 3. Backend Operation Contracts

### 3.1 Authentication & Account Management

#### `registerUser` (Callable Function — [IMPLEMENTED])
- **Description**: Registers a student or faculty member, sets up their Firestore profile, and assigns Custom Claims.
- **Request Payload**:
  ```typescript
  interface RegisterUserRequest {
    email: string;
    password: string;
    fullName: string;
    role: 'student' | 'faculty';
    // Student-specific:
    studentId?: string;
    program?: string;
    yearLevel?: string;
    section?: string;
    // Faculty-specific:
    facultyId?: string;
    department?: string;
  }
  ```
- **Validation**:
  - `email`: Valid format; must match university domain if enforced by campus policy.
  - `password`: String, minimum 8 characters.
  - `role`: Exactly `'student'` or `'faculty'`.
  - If `role === 'student'`: `studentId`, `program`, `yearLevel`, and `section` are required non-empty strings.
  - If `role === 'faculty'`: `facultyId` and `department` are required non-empty strings.
- **Behavior**:
  - Creates Firebase Auth user using `adminAuth.createUser`.
  - If `student`: assigns custom claim `{ role: 'student', status: 'active' }`, writes profile to `users/{uid}` with `status: 'Active'`.
  - If `faculty`: assigns custom claim `{ role: 'faculty', status: 'pending_approval' }`, writes profile to `users/{uid}` with `status: 'Pending approval'`, logs audit event.
- **Response**: `{ success: boolean, uid: string, status: 'Active' | 'Pending approval', message: string }`

#### Client-Side Auth Service (`client/src/firebase/auth.js` — [IMPLEMENTED])
- `loginUser(email, password)`: Authenticates via Firebase Auth, checks Firestore `status !== 'Suspended'`.
- `logoutUser()`: Signs out active Firebase Auth session.
- `sendPasswordReset(email)`: Triggers Firebase Auth password reset email.
- `updateUserProfile(uid, updates)`: Updates allowed profile fields (`fullName`, `avatarUrl`, `program`, `yearLevel`, `section`, `department`) in Firestore and Auth.
- `subscribeUserProfile(uid, callback)`: Real-time listener (`onSnapshot`) syncing profile changes.

#### `manageAccountStatus` (Callable Function — Admin Only — [IMPLEMENTED])
- **Description**: Approves/declines a faculty account, or suspends/reactivates any user account.
- **Request Payload**:
  ```typescript
  interface ManageAccountStatusRequest {
    targetUid: string;
    action: 'approve_faculty' | 'decline_faculty' | 'suspend_user' | 'activate_user';
    reason?: string;
  }
  ```
- **Authorization**: Caller must have `role === 'admin'` in custom claims (`assertAdmin`).
- **Validation**:
  - Validates `assertAllowedKeys` (rejects unexpected parameters).
  - Target user must exist in Firestore.
  - State machine invariants:
    - Cannot approve non-faculty or already active faculty.
    - Cannot decline non-faculty.
    - Cannot suspend already suspended account.
    - Admins cannot suspend or decline their own account (prevents accidental lockout).
- **Behavior**:
  - Updates custom claims on target user (`adminAuth.setCustomUserClaims`).
  - Updates `users/{targetUid}.status` (and `approvedAt`, `approvedBy` for approvals).
  - Appends audit entry in `activity_logs`.
  - Revokes refresh tokens on suspension or decline.
- **Response**: `{ success: boolean, targetUid: string, previousStatus: string, newStatus: string, action: string }`

#### `setAdminRole` (Callable Function — Admin Only — [IMPLEMENTED])
- **Description**: Grants or revokes the administrator role for an existing campus member.
- **Request Payload**:
  ```typescript
  interface SetAdminRoleRequest {
    targetUid: string;
    enabled: boolean;
  }
  ```
- **Authorization**: Caller must have `role === 'admin'` in custom claims (`assertAdmin`).
- **Validation**:
  - Admins cannot revoke their own admin privileges.
  - Target user must exist.
- **Behavior**:
  - Updates custom claims: `{ role: enabled ? 'admin' : ..., status: 'active' }`.
  - Updates Firestore profile `role` and `status`.
  - Records immutable audit log in `activity_logs`.
- **Response**: `{ success: boolean, targetUid: string, role: string, isAdmin: boolean }`

#### Server Authorization Helpers (`functions/src/utils/auth-guards.ts` — [IMPLEMENTED])
- `assertAuthenticated(auth)`: Requires valid Firebase Auth session; returns `{ uid, token }`.
- `assertAdmin(auth)`: Requires `token.role === 'admin'`; throws `permission-denied` if missing/ordinary user.
- `assertActiveUser(auth)`: Requires `token.status === 'active'`; throws `permission-denied` for suspended/pending users.
- `assertOwnerOrAdmin(auth, resourceOwnerUid)`: Requires caller to be resource owner or admin.
- `assertAllowedKeys(payload, allowedKeys, contextName)`: Strictly rejects payloads with unexpected keys.

---

### 3.2 Report Listings Management

#### `createReport` (Client Firestore Write + Cloud Storage)
- **Workflow**:
  1. Client uploads image (if provided) to `/reports/{tempId}/image` with metadata.
  2. Client writes report document to `reports/{reportId}`:
  ```typescript
  interface ReportDocument {
    id: string;               // e.g., "R-1072" or autogenerated Firestore ID
    ticketNumber: string;     // Formatted display ticket, e.g. "R-1072"
    title: string;            // e.g., "Silver Charm Bracelet"
    category: string;         // e.g., "Electronics", "Clothing & Apparel"
    type: 'LOST' | 'FOUND';   // Listing type
    status: 'Active' | 'Pending Claim' | 'Pending Match' | 'Resolved' | 'Closed';
    date: string;             // ISO date string or YYYY-MM-DD
    location: string;         // e.g., "Gymnasium Bleachers"
    description: string;      // Detailed description
    imageUrl?: string | null; // Download URL from Firebase Storage
    imageStoragePath?: string;// Storage path for cleanup
    reporterUid: string;      // Authenticated reporter UID
    reporterName: string;     // Full name of reporter
    reporterRole: 'Student' | 'Faculty' | 'Admin';
    reporterProgramOrDept: string;
    claimsCount: number;      // Denormalized count (defaults to 0)
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
  }
  ```
- **Validation**:
  - `title`, `category`, `type`, `date`, `location`, `description` required.
  - `date` <= current date (cannot report future events).
  - Image size <= 10MB, allowed types: `image/png`, `image/jpeg`, `image/webp`.

#### `updateReportListing` / `deleteReportListing`
- **Rules**:
  - Normal users may only edit or close listings where `reporterUid === request.auth.uid`.
  - Admins may delete or update any listing.
  - Deleting a listing triggers storage cleanup for associated images and removes linked claims.

---

### 3.3 Claim & Match Processing

#### `submitClaimOrMatch` (Callable Function or Transactional Firestore Write)
- **Description**: Submits a claim on a FOUND item, or a found report match on a LOST item.
- **Request Payload**:
  ```typescript
  interface SubmitClaimRequest {
    reportId: string;
    mode: 'claim' | 'found_report';
    proofDetails: string;      // Proof of ownership or location found details
    attachmentUrls?: string[]; // Array of Storage URLs (up to 3 files)
  }
  ```
- **State Transition**:
  - Validates that target report exists and `status === 'Active'` (or already `Pending Claim`/`Pending Match`).
  - Creates claim document in `reports/{reportId}/claims/{claimId}`:
    ```typescript
    interface ClaimDocument {
      id: string;
      ticketId: string;          // e.g., "#CLM-8492" or "#FND-5912"
      reportId: string;
      claimantUid: string;
      claimantName: string;
      claimantRole: string;
      mode: 'claim' | 'found_report';
      status: 'Pending' | 'Approved' | 'Declined' | 'Withdrawn';
      proofDetails: string;
      attachmentUrls: string[];
      createdAt: FirebaseFirestore.Timestamp;
      updatedAt: FirebaseFirestore.Timestamp;
    }
    ```
  - Increments `reports/{reportId}.claimsCount`.
  - Transitions `reports/{reportId}.status` to `'Pending Claim'` (for FOUND item) or `'Pending Match'` (for LOST item).
  - Creates initial message in `claims/{claimId}/messages`.
  - Dispatches notification to report owner.

#### `reviewClaim` (Callable Function — Report Owner or Admin)
- **Description**: Resolves or declines a claim.
- **Request Payload**:
  ```typescript
  interface ReviewClaimRequest {
    reportId: string;
    claimId: string;
    action: 'approve' | 'decline';
    handoverInstructions?: string; // Location & instructions if approved
    declineReason?: string;        // Explanation if declined
  }
  ```
- **State Transition**:
  - **If `action === 'approve'` (Atomic Transaction)**:
    - Target claim `status` -> `'Approved'`.
    - Report `status` -> `'Resolved'`.
    - All other pending claims for this report -> `'Declined'` with reason: "Another claim was verified for this item."
    - Dispatches approval notification with handover details to the winning claimant.
    - Logs audit log entry.
  - **If `action === 'decline'`**:
    - Target claim `status` -> `'Declined'`.
    - Checks remaining active claims for this report. If none remain, report `status` reverts to `'Active'`.
    - Dispatches decline notification to claimant.

#### `withdrawClaim` (Client Write / Callable Function — Claimant Only)
- **Description**: Claimant withdraws an in-progress claim.
- **Conditions**: `request.auth.uid === claim.claimantUid` and `claim.status === 'Pending'`.
- **State Transition**:
  - Claim `status` -> `'Withdrawn'`.
  - Decrements active claims count on parent report. If 0 active claims remain, parent report reverts to `'Active'`.

---

### 3.4 In-Modal Messaging & Real-Time Chat

#### Message Thread Structure
Messages live in a subcollection under the claim: `reports/{reportId}/claims/{claimId}/messages/{messageId}`.

```typescript
interface ChatMessageDocument {
  id: string;
  senderUid: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: FirebaseFirestore.Timestamp;
  isRead: boolean;
}
```

- **Permission**: Only the report owner (`report.reporterUid`), the claimant (`claim.claimantUid`), and admins may read or send messages in a thread.
- **Real-Time Client Hook**: Client binds using Firestore `onSnapshot` ordered by `createdAt asc`.

---

## 4. State Machines & Lifecycle Diagrams

### Report State Machine
```
   [ Create Report ]
           │
           ▼
       [ Active ] ◄────────────────────────┐
        │      │                           │
  Claim │      │ Match                     │ All claims
  filed │      │ filed                     │ declined/withdrawn
        ▼      ▼                           │
   [Pending] [Pending] ────────────────────┘
   [ Claim ] [ Match ]
        │          │
        │ Owner    │ Owner
        │ approves │ approves
        ▼          ▼
       [ Resolved ] (Handover Complete)
           │
           ▼ (or User/Admin closes)
        [ Closed ]
```

### Claim State Machine
```
   [ Submit Claim ]
          │
          ▼
     [ Pending ]
    ┌─────┼─────────┐
    │     │         │
Claimant  Owner   Owner
withdraws decline approves
    │     │         │
    ▼     ▼         ▼
[Withdrawn] [Declined] [Approved]
```

---

## 5. Critical Edge Cases & Mitigation Strategies

1. **Concurrent Claim Approvals**: Two users claim the same item simultaneously. An atomic Firestore transaction must acquire a lock on the report document, verify it is not yet `'Resolved'`, and approve exactly one claim while declining others.
2. **Withdrawal After Approval**: A user attempts to withdraw a claim that was already marked `'Approved'`. Rejected with error code `failed-precondition`.
3. **Report Deletion with Active Claims**: When a reporter or admin deletes a listing, all associated active claims must be cancelled, files in Cloud Storage purged, and claimants notified of cancellation.
4. **Suspended User Interception**: If an account is suspended while an active session exists, Firestore Security Rules and Cloud Functions must immediately block read/write operations by verifying `request.auth.token.status !== 'suspended'`.
5. **Orphaned Storage Uploads**: If a user uploads an image but abandons report creation before submitting the document, a Cloud Function scheduled cleanup or temp directory lifecycle rule purges orphaned files after 24 hours.
