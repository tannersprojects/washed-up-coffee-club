# Authentication: Strava-Only Login with Supabase

## Overview

Users sign in exclusively with their Strava account—no separate email/password registration. To keep Supabase's benefits (RLS, Realtime, Session Management), we use the **Shadow User Pattern**.

## Architecture: The Shadow User Pattern

1. **User Experience:** User clicks "Connect with Strava" → authorizes on Strava → redirected to dashboard.
2. **Backend Logic:**
   - **Supabase Auth (`auth.users`)**: Session manager. Each Strava user has a "shadow" user with a generated email (e.g. `12345678@strava.washed-up.club`).
   - **`strava_connections`**: Links Supabase user to Strava athlete ID and stores OAuth tokens.

## Prerequisites

- Supabase project (local or cloud)
- Strava API application at [Strava Settings](https://www.strava.com/settings/api)
- Service Role key for server-side user creation

### Environment Variables

See [`.env.example`](../../.env.example) for required variables. Auth-specific: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI`.

## Database Schema

See [`project_context.md`](./project_context.md) Section 3 and [`src/lib/db/schema.ts`](../../src/lib/db/schema.ts). Auth uses `profile` and `strava_connections`.

## Auth Flow

1. **Login** (`/auth/strava/login`): Redirects to Strava OAuth with `state` (CSRF cookie).
2. **Callback** (`/auth/strava/callback`): Validates `state`, exchanges `code` for tokens, calls `findOrCreateShadowUser`, creates Supabase session.
3. **Token refresh**: Strava tokens expire every 6 hours. `hooks.server.ts` and `refreshConnectionIfNeeded` in `strava.ts` handle refresh before API calls.

Implementation: `src/lib/server/auth.ts`, `src/lib/server/strava.ts`, `src/routes/auth/strava/`.

## Security & RLS

- **`strava_connections`**: `SELECT` where `auth.uid() = profile_id`; `INSERT`/`UPDATE` via Service Role only (callback route).
- **State cookie**: `httpOnly` and `secure` flags.

## Key Files

| Purpose                                 | Path                                         |
| --------------------------------------- | -------------------------------------------- |
| Shadow user creation, session           | `src/lib/server/auth.ts`                     |
| OAuth URL, token exchange, refresh      | `src/lib/server/strava.ts`                   |
| Login route                             | `src/routes/auth/strava/login/+server.ts`    |
| Callback route                          | `src/routes/auth/strava/callback/+server.ts` |
| Logout route                            | `src/routes/auth/logout/+server.ts`          |
| Profile + token refresh on each request | `src/hooks.server.ts`                        |
| Logout in nav dropdown                  | `src/lib/components/AppNav.svelte`           |
