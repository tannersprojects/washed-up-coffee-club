# Project Context: Washed Up Coffee Club Leaderboard

## 1. Application Overview

**Goal:** Build a web-based leaderboard for a local running club to track monthly challenges.

**Core Feature:** "Flash Challenges" (e.g., a 24-hour window to complete a Half Marathon triggered by the owner).

**Stack:** SvelteKit (Frontend & Server API) + Supabase (Auth/DB).

**Data Source:** Strava API (OAuth 2.0).

**Legal Status:** Applying for "Community Application" status under Strava API terms.

## 2. Compliance & Strategy (CRITICAL)

**Current Status:** "Single Player Mode" (Restricted to Owner only).

**Target Status:** "Community Application" (Allows data display to club members).

### Strictly Enforced Rules:

- **User Limit:** The app is strictly for local club members (<100 users).
- **Data Privacy:** Data is only displayed to users who have authenticated via Strava. No public links for non-members.
- **Attribution:**
  - **Login Screen:** Must use the official orange "Connect with Strava" button.
  - **Leaderboard Footer:** Must display the "Powered by Strava" logo on any page showing data.
  - **Links:** Athlete names and Activities must link back to Strava.com.
- **Terminology:** Do NOT use "Strava" in the app name or challenge title.

## 3. Database Schema (Supabase / Drizzle)

The current schema is defined in detail in [`src/lib/db/schema.ts`](../src/lib/db/schema.ts). This section summarizes the parts most relevant to the dashboard and leaderboard.

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
- `type` (enum): see `CHALLENGE_TYPE` in `src/lib/constants/challenge-constants.ts`.
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
- `status` (enum): see `PARTICIPANT_STATUS` in `src/lib/constants/participant-constants.ts`.
- `joinedAt` (timestamp).
- `resultValue` (integer): cached value used for sorting.
- `resultDisplay` (text): formatted time/distance for UI.
- `highlightActivityId` (bigint, nullable): ties a participant to a specific Strava activity.
- `createdAt`, `updatedAt` (timestamps).

### 5. `challenge_contributions`

- `id` (UUID, PK).
- `participantId` (UUID, FK → `challenge_participants.id`).
- `stravaActivityId` (bigint): Strava activity identifier.
- `activityName` (text, nullable).
- `value` (integer): contribution value in meters or other units depending on challenge type.
- `isValid` (boolean): allows invalidating a specific run without deleting it.
- `occurredAt` (timestamp with time zone).
- `createdAt` (timestamp with time zone).

These tables together power the dashboard: `challenges` define the events, `challenge_participants` track who is in each challenge and their aggregate result, and `challenge_contributions` store the individual Strava activities that feed into the leaderboard.

## 4. Data Models (TypeScript)

The main dashboard‑level types are defined in [`src/lib/types/dashboard.ts`](../src/lib/types/dashboard.ts). Key types:

```ts
import type {
  Profile,
  Challenge,
  ChallengeParticipant,
  ChallengeContribution
} from '$lib/db/schema';

export type ChallengeParticipantWithRelations = ChallengeParticipant & {
  profile: Profile;
  contributions: ChallengeContribution[];
};

export type LeaderboardRowData = {
  participant: ChallengeParticipantWithRelations;
  profile: Profile;
  contribution: ChallengeContribution | null;
  rank: number | null;
};

export type ChallengeWithParticipation = Challenge & {
  isParticipating: boolean;
  participant: ChallengeParticipant | null;
};
```

These types are hydrated into smart classes in the dashboard logic:

- `DashboardUI` (manages the list of challenges and the selected challenge).
- `ChallengeUI` (wraps a single challenge and owns its `LeaderboardUI`).
- `LeaderboardUI` (builds `leaderboardRows: LeaderboardRowData[]` and derived stats for display).

## 5. Authentication Flow

**Method:** OAuth 2.0 Authorization Code Flow.

**Scope Request:**
- `read`: To view public profile info.
- `activity:read`: To scan activities for the challenge.

**Token Management (Supabase):**
- **Crucial:** Store refresh_token in strava_connections table.
- **Row Level Security (RLS):** Ensure strava_connections is only readable by the Service Role (backend) and the user themselves.

## 6. Site Structure (SvelteKit)

- **Route `/` (Landing):** Public marketing page. Contains "Connect with Strava" button.
- **Route `/dashboard` (Protected):** The main app interface. Requires active session.
  - Component: Countdown Timer (if active).
  - Component: Split Leaderboard (Completed vs Pending).
- **Route `/admin` (Protected + Admin Only):**
  - Action: Form to Create New Challenge.
  - Action: Button to "Force Sync" leaderboard (Backup for webhooks).
- **Route `/api/webhooks/strava` (Public Endpoint):**
  - GET: Handles Strava's subscription verification (echoing hub.challenge).
  - POST: Handles incoming activity events.

## 7. Asset Placement Guide

| Component | Asset Needed | Placement |
|-----------|--------------|-----------|
| Login Page | `btn_strava_connectwith_orange.svg` | Primary CTA. No other colors allowed. |
| Leaderboard | `api_logo_pwrdBy_strava_horiz_light.svg` | Footer. Must be visible and distinct. |
| Athlete Name | Link (`<a>`) | `<a href="https://strava.com/athletes/{id}" target="_blank">` |

## 8. Webhook Architecture (Primary Sync)

**Goal:** Instant updates when a user finishes a run.

**Implementation:** SvelteKit API Route (`src/routes/api/webhooks/strava/+server.ts`).

### Logic Flow:

1. **Ingest:** Strava sends POST to `https://[your-domain]/api/webhooks/strava`.
2. **Filter Event:**
   - If `aspect_type != 'create'`, ignore.
   - If `object_type != 'activity'`, ignore.
3. **Check Active Challenge:** Query challenges table via supabase-admin client. Is there a challenge active right now? If no, exit.
4. **Fetch Activity Details:**
   - Get `owner_id` (Strava ID) from payload.
   - Look up `access_token` in `strava_connections`.
   - Call Strava API: `GET /activities/{object_id}`.
5. **Verify Criteria:**
   - Is `type == 'Run'`?
   - Is `distance >= challenge.goal_distance_meters`?
6. **Update Leaderboard:** Insert into `challenge_results`.

## 9. Admin Workflow (Owner Only)

**Goal:** Allow the club owner to create a "Flash Challenge" from their phone without touching the database directly.

### Authorization Strategy (Manual Promotion):

Since there is only one owner, we do not need to build an "Invite Admin" feature. We will "bootstrap" the first admin manually.

1. **Step 1:** The Owner (you/client) logs into the website normally via Strava.
2. **Step 2:** Go to the Supabase Dashboard -> SQL Editor.
3. **Step 3:** Run this command to promote that specific user:

```sql
UPDATE profiles 
SET is_admin = true 
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
- Register the webhook with Strava pointing to your live domain: `https://[your-domain].com/api/webhooks/strava`.
- The live app will update automatically via webhooks.
- The "Force Sync" button remains available as a backup.
