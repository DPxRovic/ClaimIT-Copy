# ClaimIt — Campus Lost and Found Web Application

ClaimIt is a web-based lost-and-found management platform built for school and university campus communities. It provides a modern interface for students, faculty, and administrative staff to report, track, claim, and return lost property.

---

## 1. Project Overview

On busy university campuses, valuable items such as student IDs, electronics, textbooks, keys, and personal belongings are misplaced every day. ClaimIt replaces informal physical boxes and social media bulletins with a verified workflow featuring:
- Categorized item reporting for lost and found items.
- Public searchable campus catalog with multi-criteria filtering.
- Two-way verification workflows (claims on found items and matches on lost items).
- Secure in-modal direct messaging between finders and owners.
- Role-based administration for student affairs and campus security desks.
- Immutable activity auditing.

---

## 2. Technology Stack

### Existing Frontend Stack (Implemented)
- **Framework**: React 19.2 (Single Page Application)
- **Bundler & Dev Server**: Vite 8.3
- **Styling**: Tailwind CSS (Utility classes & CDN runtime)
- **Icons**: Lucide React (`lucide-react`)
- **Typography**: Inter (Body text) & Plus Jakarta Sans (Headlines)
- **Package Manager**: npm (configured with npm workspace for `/client`)
- **Linter**: Oxlint (`oxlint`)

### Intended Backend Stack (Planned)
- **Authentication**: Firebase Authentication with Custom Claims (RBAC).
- **Database**: Cloud Firestore (NoSQL document store).
- **File Storage**: Firebase Storage (Item photographs and claim evidence attachments).
- **Serverless Compute**: Firebase Cloud Functions (2nd Gen, Node.js 22 / TypeScript).
- **Server SDK**: Firebase Admin SDK (Trusted operations).
- **Local Dev & Testing**: Firebase Emulator Suite.
- **Client Integration**: Firebase Web SDK (v10+ modular).

*Note: The backend stack is planned and documented in the canonical design files. It has not yet been provisioned or implemented.*

---

## 3. Repository Structure

```
claimit/
├── client/                     # Frontend client workspace
│   ├── index.html              # HTML entry point with metadata & Tailwind CDN
│   ├── package.json            # Client dependencies and scripts
│   ├── vite.config.js          # Vite configuration (0.0.0.0:3000)
│   └── src/
│       ├── main.jsx            # React root mount
│       ├── App.jsx             # Top-level view router
│       ├── index.css           # Global typography & layout rules
│       ├── assets/             # Static logos and hero imagery
│       └── components/         # 48+ modular React UI components
├── server/                     # Backend workspace (.gitkeep; backend pending)
├── .env.example                # Environment variables template
├── metadata.json               # Application metadata configuration
├── package.json                # Root package.json configuring workspace
├── CLAUDE.md                   # Canonical AI & developer operating guidelines
├── PRODUCT.md                  # Canonical functional specifications & business rules
├── DESIGN.md                   # Canonical backend interaction & API design
├── ARCHITECTURE.md             # Canonical technical architecture & database schemas
└── README.md                   # Project overview & documentation (this file)
```

---

## 4. Prerequisites & Installation

### Prerequisites
- **Node.js**: v22.x
- **npm**: v10.x or newer

### Installation
Clone or navigate to the repository directory and install dependencies:

```bash
npm install
```

This installs both root workspace dependencies and client dependencies in a single step.

---

## 5. Development & Emulator Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server on `0.0.0.0:3000` |
| `npm run build` | Builds both frontend (`client/dist`) and Cloud Functions (`functions/lib`) |
| `npm run build:client` | Builds frontend SPA only |
| `npm run build:functions` | Compiles Cloud Functions TypeScript only (`tsc`) |
| `npm run lint` | Runs oxlint on frontend and typecheck on Cloud Functions |
| `npm test` | Executes all authentication, profile, and security rules test suites |
| `npm run test:security` | Executes the 10-suite security rules & authorization test harness |
| `npm run provision:admin` | CLI tool to provision or revoke administrator privileges via Admin SDK |
| `npm run preview` | Serves the production client build locally on port 3000 |
| `npm run emulators` | Launches Firebase Emulator Suite (Auth: 9099, Firestore: 8080, Functions: 5001, Storage: 9199, UI: 4000) |
| `npm run emulators:export` | Exports emulator state to `./emulator-data` |
| `npm run emulators:import` | Starts emulators importing state from `./emulator-data` |

---

## 6. Environment Configuration

Copy `.env.example` to create your local environment file:

```bash
cp .env.example .env
```

### Environment Settings Overview
- **`VITE_USE_FIREBASE_EMULATOR=true`**: Connects client SDK instances to local emulators automatically.
- **`VITE_FIREBASE_*`**: Public project identifiers for Firebase Web SDK v11.
- **Server Credentials**: Handled automatically in Cloud Functions IAM or by local Firebase Emulator Suite.

---

## 7. Milestone Roadmap & Implementation Status

ClaimIt follows a disciplined 10-milestone backend development plan:

- [x] **Milestone 1**: Project Audit, Canonical Documentation (`CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, `README.md`), and Workspace Normalization.
- [x] **Milestone 2**: Backend Tooling, Firebase Project Setup, Local Emulator Suite Configuration, and Client/Server SDK Initialization.
- [x] **Milestone 3**: Firebase Authentication, Registration, and Role-Based Access Control (Custom Claims).
- [x] **Milestone 4**: Roles, Authorization, and Firebase Security Rules (`firestore.rules`, `storage.rules`, `auth-guards.ts`, `provision-admin.js`).
- [x] **Milestone 5**: Lost & Found Report Creation Backend, Storage Image Uploads, Lifecycle Rules, and Client Form Integration (`createReport`, `updateReport`, `closeReport`, `deleteReport`).
- [ ] **Milestone 6**: Reports Catalog & Browse (Full Browse, Search, Category Filter, and Real-Time Listeners).
- [ ] **Milestone 7**: Claims & Ownership Verification Implementation with Cloud Functions.
- [ ] **Milestone 8**: Real-Time Direct Messaging and Notifications Integration.
- [ ] **Milestone 9**: Admin Dashboard, User Management, Taxonomy Lists, and Activity Logging.
- [ ] **Milestone 10**: End-to-End Integration Testing, Security Audit, and Production Build Verification.

---

## 8. Current Limitations & Known State

1. **Authentication & User Profiles Active**: Firebase Authentication, `AuthContext`, session persistence across reloads, protected field validation, and Firestore `users/{uid}` profiles are implemented.
2. **Report Creation & Storage Uploads Active (Milestone 5)**: Lost and Found reports are created with server-assigned ticket IDs, verified creator UID, initial 'Active' status, and Storage image integration with 10MB bounds.
3. **Soft-Close & Administration Rules**: Report creators can soft-close their own reports; hard deletions are restricted to administrators.
4. **Claims & Verification Pending (Milestone 7)**: Claims submission and two-way verification workflows remain closed at the Security Rules boundary until Prompt 7.
5. **No Automated AI Matching**: Lost-and-found matches are submitted manually by campus members against existing listings.
