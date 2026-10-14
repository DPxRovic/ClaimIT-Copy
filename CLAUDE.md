# CLAUDE.md — Agent & Developer Operating Guidelines for ClaimIt

This document establishes the canonical operational instructions, development standards, and architectural rules for any AI coding assistant or engineer working on the **ClaimIt** codebase.

---

## 1. Project Purpose & Core Architecture

ClaimIt is a comprehensive university campus Lost and Found management web application. It connects students, faculty, and administrative staff to report lost or found items, browse active campus listings, verify ownership through claims with evidence, message securely, and manage item returns.

### Technology Stack
- **Frontend**: React 19.2, Vite 8, Tailwind CSS (CDN-loaded in development), Lucide React (vector icons), Plus Jakarta Sans & Inter typography.
- **Backend (Target Stack)**:
  - **Firebase Authentication**: User accounts, email verification, password reset, and role-based access control (RBAC) via Custom Claims.
  - **Cloud Firestore**: Real-time scalable NoSQL document database.
  - **Firebase Storage**: Secure file and image storage (item photographs, claimant proof documents, user avatars).
  - **Firebase Cloud Functions (2nd Gen)**: Trusted server-side operations, lifecycle state transitions, background triggers, and administrative actions.
  - **Firebase Admin SDK**: Server-side privileged operations executing in Cloud Functions.
  - **Firebase Emulator Suite**: Local, isolated testing environment for Auth, Firestore, Storage, and Functions.
  - **Firebase Web SDK (v10+ modular)**: Frontend client library for authentication, real-time listeners (`onSnapshot`), and callable Cloud Functions.

---

## 2. Milestone Discipline & Implementation Scope

- **Sequential Execution**: Follow the milestone prompts strictly.
- **Current Milestone**: **Milestone 4 Completed — Roles, Authorization & Firebase Security Rules Implemented (Ready for Milestone 5 / Reports Lifecycle)**.
- **Scope Restriction**: Only implement features requested for the active milestone. Do NOT jump ahead to reports, claims, messaging, or admin modules until their respective prompts.
- **Preserve Existing Frontend**:
  - Do NOT redesign or restyle the frontend.
  - Do NOT rewrite or delete working components or styles.
  - Do NOT alter existing layouts, typography, or UI design tokens.
  - Respect existing component props, mock datasets, and UX interaction patterns.

---

## 3. Repository Inspection & Modification Rules

1. **Read Before Writing**: Always inspect relevant source files before proposing or writing code. Inspect prop contracts, state shapes, and event handlers.
2. **Respect Existing Interfaces**: The frontend components in `client/src/components/` expect specific object shapes (e.g., reports, claims, user profiles, verification modals). Backend integrations must adapt to and satisfy these existing contracts.
3. **No Unrelated Dependencies**: Only install packages required for the active milestone.
4. **Clean Workspace Boundary**: AI Studio executes at the repository root (`/`). All frontend code lives in `/client`, while backend and functions code will be organized in designated directories (`/server` or `/functions`).

---

## 4. Coding Conventions & Standards

- **Language & Modules**: Modern ECMAScript / TypeScript. Native ES Modules (`import`/`export`).
- **React Patterns**: Functional components, React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`). Follow React Rules of Hooks strictly (never call hooks conditionally or after early returns).
- **Icons**: Use `lucide-react` vector icon components. Never render raw text strings for icons.
- **Backend Coding (Target)**:
  - Write Cloud Functions in TypeScript.
  - Use modular Firebase Web SDK v10 (`firebase/auth`, `firebase/firestore`, `firebase/storage`, `firebase/functions`).
  - Validate all inputs on the server using a schema validator (such as Zod). Never trust client-provided payloads without validation.
  - Wrap async operations in structured `try/catch` blocks with clear error propagation.
  - Use atomic batch writes or Firestore transactions whenever updating multiple related documents (e.g., approving a claim and marking a report resolved).

---

## 5. Security Baseline & Rules

1. **Authenticated Identity Verification**: Never trust a `uid` or `userId` supplied in the request body. Always read `context.auth.uid` from authenticated Cloud Function calls or verify ID tokens server-side.
2. **No Client-Side Privilege Escalation**: Users must NEVER be allowed to set or update their own `role` or `status` fields directly in Firestore. Roles (`admin`, `faculty`, `student`) and statuses (`active`, `pending_approval`, `suspended`) must be governed by Firebase Custom Claims set exclusively via trusted Cloud Functions.
3. **No Exposed Secrets**: Never store Firebase service account keys, private keys, or API secrets in client source code or version control. Store environment configurations in `.env.example` without real credentials.
4. **Firestore Security Rules**: Client Firestore access must be governed by strict `firestore.rules`. Deny all by default, and allow reads/writes only to authenticated, authorized users.
5. **Private Claim Evidence**: Photos, receipts, and descriptions submitted as claim proof must only be readable by the claimant, the report poster, and authorized administrators. They must NOT be publicly accessible.
6. **Storage Security**: Enforce upload constraints in `storage.rules`: authenticate user, validate MIME types (images only), and restrict file sizes (<= 10MB).
7. **Audit Logging**: Sensitive administrative actions (approving faculty, suspending users, resolving reports, deleting listings) must create an immutable entry in `activity_logs`. Never log passwords, tokens, or personal contact info.

---

## 6. Testing and Verification Expectations

- After making code changes, always verify compilation and linting:
  - Run `npm run lint` or `oxlint` to catch syntax and React hook issues.
  - Run `compile_applet` to ensure the project builds without errors.
  - Use Firebase Emulators for integration tests once the backend is provisioned.
- Ensure dev server runs reliably on host `0.0.0.0` and port `3000`.

---

## 7. Canonical Documentation Maintenance

Five canonical documents govern this project at the repository root:
1. `CLAUDE.md` — AI agent and developer operational standards (this file).
2. `PRODUCT.md` — Functional specifications, user roles, business rules, and product lifecycle.
3. `DESIGN.md` — Backend interaction design, API contracts, error behavior, and state machines.
4. `ARCHITECTURE.md` — Technical system architecture, Firestore schemas, Storage structure, and Security strategy.
5. `README.md` — Project setup, dev commands, and milestone tracking.

When backend decisions change or milestones are completed, all five documents must be updated in lockstep to maintain complete consistency.
