# Project Context: Washed Up Coffee Club Leaderboard

**Purpose:** Dense reference for AI assistants or other chats. For a short "what is this app" summary, use [`project_overview.md`](./project_overview.md) first.

---

## 1. Application Overview

**Goal:** Build a web-based leaderboard for a local running club to track monthly challenges.

**Core Feature:** "Flash Challenges" (e.g., a 24-hour window to complete a Half Marathon triggered by the owner).

**Stack:** SvelteKit (Frontend & Server API) + Supabase (Auth/DB).

**Data Source:** Strava API (OAuth 2.0).

**Legal Status:** Applying for "Community Application" status under Strava API terms.

## 2. Compliance & Strategy (CRITICAL)

**Current Status:** "Community Application" — permission obtained; data may be displayed to authenticated club members.

### Strictly Enforced Rules:

- **User Limit:** The app is strictly for local club members (<100 users).
- **Data Privacy:** Data is only displayed to users who have authenticated via Strava. No public links for non-members.
- **Attribution:**
  - **Login Screen:** Must use the official orange "Connect with Strava" button.
  - **Leaderboard Footer:** Must display the "Powered by Strava" logo on any page showing data.
  - **Links:** Athlete names and Activities must link back to Strava.com.
- **Terminology:** Do NOT use "Strava" in the app name or challenge title.

## 3. Database Schema (Supabase / Drizzle)

The current schema is defined in detail in [`src/lib/db/schema.ts`](../../src/lib/db/schema.ts). This section summarizes the parts most relevant to the dashboard and leaderboard.

### 1. `profile` (Public Info)

- `id` (UUID, PK): Mirrors `auth.users.id`.
- `firstname` (text).
- `lastname` (text).
- `username` (text).
- `stravaAthleteId` (bigint, unique): Immutable Strava athlete ID.
- `role` (enum): `'admin' | 'user'`.
- `createdAt`, `updatedAt` (timestamps).

### 2. `strava_connections` (Private – RLS Protected)

- `id` (UUID, PK).
- `profileId` (UUID, FK → `profile.id`): 1‑to‑1 relationship.
- `stravaAthleteId` (bigint, unique).
- `accessToken` (text).
- `refreshToken` (text).
- `expiresAt` (timestamp with time zone).
- `scope` (text).

### 3. `challenges`

- `id` (UUID, PK).
- `title` (text).
- `description` (text).
- `type` (enum): see `CHALLENGE_TYPE` in `src/lib/constants/challenge.ts`.
- `goalValue` (integer, nullable): goal value in meters for distance‑based challenges.
- `segmentId` (bigint, nullable) for segment‑based events.
- `startDate`, `endDate` (timestamps with time zone).
- `status` (enum): `upcoming`, `active`, `completed`.
- `isActive` (boolean).
- `createdAt`, `updatedAt` (timestamps).

### 4. `challenge_participants`

- `id` (UUID, PK).
- `challengeId` (UUID, FK → `challenges.id`).
- `profileId` (UUID, FK → `profile.id`).
- `status` (enum): see `PARTICIPANT_STATUS` in `src/lib/constants/participant.ts`.
- `joinedAt` (timestamp).
- `resultDistance` (real, nullable): cached total distance in meters. For cumulative: sum of contributions; for best_effort: max.
- `resultTime` (integer, nullable): cached total time in seconds. For cumulative: sum; for segment_race: min.
- `highlightActivityId` (bigint, nullable): ties a participant to the key Strava activity (best effort or latest that met goal).
- `createdAt`, `updatedAt` (timestamps).

### 5. `challenge_contributions`

- `id` (UUID, PK).
- `participantId` (UUID, FK → `challenge_participants.id`).
- `stravaActivityId` (bigint): Strava activity identifier.
- `activityName` (text, nullable).
- `distance` (real, nullable): contribution distance in meters.
- `time` (integer, nullable): contribution time in seconds.
- `isValid` (boolean): allows invalidating a specific run without deleting it.
- `occurredAt` (timestamp with time zone).
- `createdAt` (timestamp with time zone).

These tables together power the dashboard: `challenges` define the events, `challenge_participants` track who is in each challenge and their aggregate result, and `challenge_contributions` store the individual Strava activities that feed into the leaderboard.

## 4. Data Models (TypeScript)

Types are colocated by feature in `src/lib/types/`. UI classes live in each route's `_logic/` and consume these types.

### Dashboard (`src/lib/types/dashboard.ts`)

- `ChallengeParticipantWithRelations`, `LeaderboardRowData`, `ChallengeStats`, `ChallengeWithParticipation`, `DashboardContextData`.
- **UI classes:** `DashboardUI` (challenge list + selection), `ChallengeUI` (single challenge, owns `LeaderboardUI`), `LeaderboardUI` (builds `leaderboardRows`, derived stats).

### Admin (`src/lib/types/admin.ts`)

- `ChallengeWithParticipants` — challenge plus its participants (no profile/contributions).
- `AdminContextData` — loader payload: `{ memories, routineSchedules, challenges }`.
- **UI classes:** `AdminUI` (tab state, passes data to sections), `ChallengeAdmin`, `MemoryAdmin`, `RoutineScheduleAdmin` (each section's CRUD state).

### Content / Landing (`src/lib/types/content.ts`)

- `Memory`, `RoutineSchedule` — shapes for landing-page content (memories carousel, routine schedule). Used by root `+page.server.ts` and admin content management.

### Shared

- **`src/lib/types/pages.ts`** — `PAGE_NAME`, `PageName`, `getPageName(pathname)` for app nav and layout.
- **`src/lib/types/strava.ts`** — `StravaTokenResponse`, `StravaSummaryAthlete`, `StravaErrorResponse` (and other Strava API shapes); used by `src/lib/server/auth.ts` and `strava.ts`.

### Codebase conventions (Svelte 5)

- **Reactivity:** Use `$state`, `$derived`, `$effect` only; no legacy stores.
- **Colocation:** Feature logic in `src/routes/[feature]/_logic/`, feature components in `_components/`. Use `src/lib/` for shared UI and utilities.
- **State:** Context API (`setContext`/`getContext`) for feature-wide state; classes initialized in `+layout.svelte` or `+page.svelte`.
- **Components:** Accept class instances as props; keep `.svelte` for rendering and use `.svelte.ts` for non-trivial logic. Item classes implement `toJSON()` for API payloads.
- Full rules: `.cursor/rules/Svelte-5-Standards.mdc` in repo root.

## 4b. Leaderboard Sorting Rules

Implemented in `LeaderboardUI.svelte.ts`. Participants are first grouped by status (completed, in progress, registered, did not finish). Within each status group:

| Challenge Type | Completed | Incomplete |
|-----------------|-----------|------------|
| **CUMULATIVE** | Sort by time (faster = higher rank). Tiebreaker: has time ranks above no time. | Sort by distance (longer = higher rank). |
| **BEST_EFFORT** | Sort by distance (longer = higher rank). Tiebreaker: has time ranks above no time. | Sort by distance. |
| **SEGMENT_RACE** | Sort by time (faster = higher rank). | Sort by time. |

## 5. Authentication Flow

**Method:** OAuth 2.0 Authorization Code Flow. See [`auth.md`](./auth.md) for full details (Shadow User pattern, flow, key files).

**Scope Request:**
- `read`: To view public profile info.
- `activity:read`: To scan activities for the challenge.

**Token Management (Supabase):**
- **Crucial:** Store refresh_token in strava_connections table.
- **Row Level Security (RLS):** Ensure strava_connections is only readable by the Service Role (backend) and the user themselves.

## 6. Site Structure (SvelteKit)

- **Route `/` (Landing):** Public marketing page. Contains "Connect with Strava" button.
- **Route `/dashboard` (Protected):** The main app interface. Requires active session.
  - **DashboardChallengesSidebar** (Arc-style collapsible on desktop) and **ChallengesDrawer** (mobile overlay) for challenge list when multiple challenges exist.
  - **Tabs** for Challenges / Club Leaderboard; **LeaderboardTabs** (Leaderboard / Details) within each challenge.
  - Component: Countdown Timer (if active).
  - Component: Split Leaderboard (Completed vs Pending).
- **Route `/admin` (Protected + Admin Only):**
  - Action: Form to Create New Challenge.
  - Action: Button to "Force Sync" leaderboard (Backup for webhooks).
- **Route `/api/strava/webhook` (Public Endpoint):**
  - GET: Handles Strava's subscription verification (echoing hub.challenge).
  - POST: Ingests incoming activity events; inserts into `strava_webhook_logs`.
- **Route `/api/strava/process-webhook` (Internal, called by DB trigger):**
  - POST: Fetches activity details from Strava, validates against active challenges, updates `challenge_participants` and `challenge_contributions`.

### Authenticated layout

Dashboard and admin routes live under the `(app)` route group:

- **`(app)/+layout.server.ts`** — Enforces auth for all routes under `(app)`. Calls `locals.safeGetSession()`; redirects to `/` if no session, user, or profile. Returns `profile` to layout data.
- **`(app)/+layout.svelte`** — Shared layout for authenticated pages. Renders `AppNav` with `profile` and `pageName`; slots in page content via `{@render children()}`.
- **`(app)/dashboard/`** — Assumes user is authenticated; only loads dashboard data.
- **`(app)/admin/`** — Enforces admin-only access in `admin/+page.server.ts` (checks `profile.role === PROFILE_ROLE.ADMIN`, redirects non-admins to `/dashboard`).

### Key file locations

| Purpose | Path |
|--------|------|
| Shared UI components | `src/lib/components/` (Tabs, AppNav) |
| DB schema, enums, relations | `src/lib/db/schema.ts` |
| Dashboard types | `src/lib/types/dashboard.ts` |
| Challenge/participant constants | `src/lib/constants/challenge.ts`, `participant.ts`, `profile.ts` |
| Dashboard UI classes | `src/routes/(app)/dashboard/_logic/` (`DashboardUI.svelte.ts`, `ChallengeUI.svelte.ts`, `LeaderboardUI.svelte.ts`) |
| Dashboard context | `src/routes/(app)/dashboard/_logic/context.ts` |
| Admin UI classes | `src/routes/(app)/admin/_logic/` |
| Auth (session, Strava shadow user) | `src/lib/server/auth.ts` |
| Strava API helpers | `src/lib/server/strava.ts` |
| Strava OAuth routes | `src/routes/auth/strava/login/`, `auth/strava/callback/` |
| Strava webhook ingest | `src/routes/api/strava/webhook/+server.ts` |
| Strava webhook processor | `src/routes/api/strava/process-webhook/+server.ts` |
| Strava activity processor | `src/lib/server/strava-activity-processor.ts` |
| Strava assets (buttons, logos) | `src/lib/assets/` |

## 7. Asset Placement Guide

| Component | Asset Needed | Placement |
|-----------|--------------|-----------|
| Login Page | `btn_strava_connectwith_orange.svg` | Primary CTA. No other colors allowed. |
| Leaderboard | `api_logo_pwrdBy_strava_horiz_light.svg` | Footer. Must be visible and distinct. |
| Athlete Name | Link (`<a>`) | `<a href="https://strava.com/athletes/{id}" target="_blank">` |

## 8. Webhook Architecture (Primary Sync)

**Goal:** Instant updates when a user finishes a run.

**Full guide:** See [`strava_webhook.md`](../strava/strava_webhook.md) for the complete flow, setup, and key files.

**Implementation:** Two-stage flow:

1. **Ingest** (`/api/strava/webhook`): Strava sends POST; app inserts raw payload into `strava_webhook_logs`.
2. **DB trigger** (`on_strava_webhook_inserted`): Fires `pg_net.http_post` to the URL stored in `vault.secrets` (`webhook_url`), which points to `/api/strava/process-webhook`.
3. **Process** (`/api/strava/process-webhook`): Receives the inserted record, fetches activity, updates leaderboard.

### Logic Flow (process-webhook):

1. **Filter Event:** Skip if `object_type != 'activity'` or `aspect_type != 'create'`.
2. **Lookup Connection:** Look up `strava_connections` by `strava_athlete_id` from payload.
3. **Fetch Activity:** Call Strava API `GET /activities/{id}` with `include_all_efforts=true`.
4. **Validate & Process:** For each active challenge the user participates in, validate activity (sport type, distance, segment effort if applicable). See `strava-activity-validators.ts` and `strava-activity-processor.ts`.
5. **Update Leaderboard:** Insert into `challenge_contributions`; update `challenge_participants` (result_distance, result_time, status, highlight_activity_id).

## 9. Admin Workflow (Owner Only)

**Goal:** Allow the club owner to create a "Flash Challenge" from their phone without touching the database directly.

### Authorization Strategy (Manual Promotion):

Since there is only one owner, we do not need to build an "Invite Admin" feature. We will "bootstrap" the first admin manually.

1. **Step 1:** The Owner (you/client) logs into the website normally via Strava.
2. **Step 2:** Go to the Supabase Dashboard -> SQL Editor.
3. **Step 3:** Run this command to promote that specific user:

```sql
UPDATE profile
SET role = 'admin'
WHERE strava_athlete_id = [OWNER_STRAVA_ID];
```

### The Create Interface:

**Form Inputs:**
- **Title:** (e.g., "Sloppy Saturday")
- **Start Time:** (Datetime Picker) -> Stored as UTC timestamp.
- **End Time:** (Datetime Picker) -> Stored as UTC timestamp.
- **Distance:** (Number, default 13.1) -> Converted to meters (x * 1609.34) before saving.

**Submit Action:** Inserts a new row into the challenges table with `status: 'active'`.

### The Notification (Manual):

Once the challenge is created in the app, the Owner sends the group text: "Go time. 24 hours. Check the site."

## 10. Development Workflow (Localhost vs. Prod)

**Problem:** Strava Webhooks cannot hit localhost.

### Strategy:

**Local Development:**
- Do not use webhooks locally.
- Rely entirely on the Admin "Force Sync" button logic.
- When testing, click the button to manually trigger the "Fetch Activity" logic for your user.

**Production Deployment:**
- Register the webhook with Strava pointing to your live domain: `https://[your-domain].com/api/strava/webhook`.
- The live app will update automatically via webhooks.
- Configure `vault.secrets.webhook_url` to point to `https://[your-domain].com/api/strava/process-webhook` so the DB trigger can invoke the processor.
- The "Force Sync" button remains available as a backup.
