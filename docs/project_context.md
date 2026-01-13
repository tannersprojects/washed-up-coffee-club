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

## 3. Database Schema (Supabase)

### 1. profiles (Public Info)

- `id` (UUID, PK): References auth.users.id.
- `strava_athlete_id` (BigInt, Unique): Immutable ID from Strava.
- `first_name` (Text).
- `last_name` (Text).
- `avatar_url` (Text).
- `is_admin` (Boolean): New. Defaults to false. Set to true manually for the Owner.
- `created_at` (Timestamp).

### 2. strava_connections (Private - RLS Protected)

- `user_id` (UUID, PK, FK -> profiles.id): 1-to-1 relationship.
- `refresh_token` (Text): Critical for offline background fetching.
- `access_token` (Text): Short-lived token.
- `expires_at` (BigInt): Unix timestamp.

### 3. challenges (Game Config)

- `id` (UUID, PK).
- `title` (Text): e.g., "February Flash Halfy".
- `start_timestamp` (Timestamp): Window open.
- `end_timestamp` (Timestamp): Window close.
- `goal_distance_meters` (Float): e.g., 21097.5.
- `status` (Enum): 'upcoming', 'active', 'completed'.

### 4. challenge_results (Leaderboard Cache)

- `id` (UUID, PK).
- `challenge_id` (UUID, FK -> challenges.id).
- `user_id` (UUID, FK -> profiles.id).
- `is_completed` (Boolean): True if valid run found.
- `activity_data` (JSONB): Snapshot of stats { time: "1:45", pace: "8:02" }.
- `completed_at` (Timestamp).

## 4. Data Models (TypeScript)

### Core Strava Types (API Responses)

```typescript
// Strava OAuth Token Exchange Response
export interface StravaTokenResponse {
  token_type: string;
  expires_at: number; // Unix timestamp
  expires_in: number; // Seconds until expiration
  access_token: string;
  refresh_token: string;
  athlete: StravaSummaryAthlete;
}

// Strava Summary Athlete
export interface StravaSummaryAthlete {
  id: number;
  username: string | null;
  resource_state: number;
  firstname: string;
  lastname: string;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  sex: 'M' | 'F' | null;
  premium: boolean;
  summit: boolean;
  created_at: string;
  updated_at: string;
  badge_type_id: number;
  weight: number;
  profile_medium: string;
  profile: string;
  friend: null;
  follower: null;
}
```

### Application Types (Supabase/Local)

```typescript
// Represents the "Flash Challenge" Configuration
export interface ChallengeConfig {
  id: string;
  title: string;           // "February Flash Halfy"
  start_timestamp: number; // Unix Epoch
  end_timestamp: number;   // Unix Epoch
  goal_distance_meters: number; // 21097.5 for Half Marathon
  is_active: boolean;
}

// The Leaderboard Row (Computed)
export interface LeaderboardEntry {
  rank: number;
  athlete: StravaSummaryAthlete; 
  status: "Completed" | "Pending";
  stats?: {
    distance_miles: number;
    elapsed_time_formatted: string; 
    pace_per_mile: string;
    activity_id: number;
  };
}
```

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
