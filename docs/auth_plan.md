# Authentication Plan: Strava-Only Login with Supabase

## Overview

This document outlines the strategy for implementing a "Sign in with Strava" flow. The goal is to allow users to log in exclusively using their Strava account, without requiring a separate email/password registration step.

To achieve this while maintaining the benefits of Supabase's ecosystem (Row Level Security, Realtime, Session Management), we will use the **"Shadow User" Pattern**.

## Architecture: The Shadow User Pattern

1.  **User Experience:**
    *   User clicks "Sign in with Strava".
    *   User authorizes the app on Strava.
    *   User is logged in and redirected to the dashboard.

2.  **Backend Logic:**
    *   **Supabase Auth (`auth.users`)**: Acts as the session manager. Every Strava user will have a corresponding "shadow" user in Supabase with a generated email address (e.g., `12345678@strava.user`).
    *   **Custom Table (`public.strava_connections`)**: Stores the link between the Supabase User ID and the Strava Athlete ID, along with the OAuth tokens.

## Prerequisites

*   **Supabase Project**: Set up and running (Locally or Cloud).
*   **Strava API Application**: Registered at [Strava Settings](https://www.strava.com/settings/api).
*   **Service Role Key**: Required for server-side user management (creating users without passwords).

### Environment Variables

Ensure these are present in your `.env` file:

```env
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...          # Required for Admin operations (Service Role)
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
STRAVA_REDIRECT_URI=http://localhost:5173/auth/strava/callback
```

## Database Schema

We use Drizzle ORM to manage the `profile` and `strava_connections` tables. See the full definitions in `src/lib/db/schema.ts`. The parts relevant to auth and Strava are:

```ts
export const profileTable = pgTable(
  'profile',
  {
    id: uuid('id').primaryKey(),
    firstname: text('firstname').notNull(),
    lastname: text('lastname').notNull(),
    username: text('username').notNull(),
    stravaAthleteId: bigint('strava_athlete_id', { mode: 'number' }).unique(),
    role: profileRoleEnum('role').notNull().default(PROFILE_ROLE.USER),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  }
);

export const stravaConnectionsTable = pgTable(
  'strava_connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profileTable.id, { onDelete: 'cascade' }),
    stravaAthleteId: bigint('strava_athlete_id', { mode: 'number' }).notNull().unique(),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    scope: text('scope').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  }
);
```

## Implementation Steps

### 1. OAuth Authorization Route
**Path:** `/auth/strava/login`

*   **Action:** Redirects the user to Strava's OAuth page.
*   **Parameters:**
    *   `client_id`: From env.
    *   `redirect_uri`: From env.
    *   `response_type`: `code`
    *   `scope`: `activity:read_all,profile:read_all`
    *   `state`: Random CSRF token (stored in a secure cookie).

### 2. OAuth Callback Route
**Path:** `/auth/strava/callback`

*   **Action:** Handles the redirect from Strava.
*   **Logic:**
    1.  **Validate State:** Compare returned `state` with the stored cookie to prevent CSRF.
    2.  **Exchange Token:** POST to `https://www.strava.com/oauth/token` with the `code`.
    3.  **Get Athlete Data:** Response includes `access_token`, `refresh_token`, and the `athlete` profile.
    4.  **Find or Create User:**
        *   **Check DB:** Does a connection exist for this `strava_athlete_id`?
        *   **If Yes:** Retrieve the associated `user_id`.
        *   **If No:**
            *   Create a new Supabase User via Admin API using a deterministic email (e.g., `${athlete.id}@strava.washed-up.club`).
            *   Mark email as confirmed.
            *   Insert new record into `strava_connections`.
    5.  **Create Session:**
        *   **Option A (Admin API):** Use `supabase.auth.admin.createSession({ user_id })` (if available/supported by your plan/version).
        *   **Option B (Sign In):** Use `supabase.auth.signInWithPassword` (requires setting a known password for the shadow user - less secure).
        *   **Option C (Magic Link - Implicit):** Generate a magic link and verify it immediately server-side? (Complex).
        *   **Recommended (PKCE/Auth Code):** The cleanest way is often to generate a custom JWT if you own the auth system, but with Supabase, we want *their* session.
        *   **Revised "Shadow User" Strategy for Session:**
            Since we have the Service Role key, we can simply sign the user in using the Admin API or creating a session.
            *   *Best Practice:* If using SSR, we can set the session cookies manually if we get the tokens from `createSession`.

### 3. Token Management (Middleware/Hooks)

*   **Refresh Logic:** Strava tokens expire every 6 hours.
*   **Where:** Before making any API request to Strava on behalf of a user.
*   **How:** Check `expires_at` in the DB. If expired, use `refresh_token` to get new tokens and update the DB.

### 4. User Interface

*   **Login Page:** Simple button "Connect with Strava".
*   **Profile/Dashboard:** Shows connected status (optional, since they *are* connected if logged in).

## Security & RLS

*   **RLS Policies:**
    *   `strava_connections`:
        *   `SELECT`: `auth.uid() = profile_id` (user can see their own tokens via their profile row).
        *   `INSERT/UPDATE`: Service Role only (handled by the callback route).
*   **Cookies:** Use `httpOnly` and `secure` flags for the state cookie.

## Current State on this branch

*   `src/lib/server/strava.ts` contains helpers for URL generation, token exchange and refresh.
*   `src/lib/server/auth.ts` implements the shadow‑user creation/lookup and uses `profileId` for `strava_connections`.
*   `/auth/strava/login` and `/auth/strava/callback` are implemented as SvelteKit server routes under `src/routes/auth/strava/`.
*   `src/hooks.server.ts` populates `event.locals.profile` from the `profile` table on each request and keeps Strava tokens fresh via `strava_connections`.
*   Logout is implemented as a POST to `/auth/logout` (`src/routes/auth/logout/+server.ts`) and exposed via the dropdown in `src/routes/dashboard/_components/DashboardNav.svelte`.

