# Project Overview: Washed Up Coffee Club

## Vision
The **Washed Up Coffee Club** app is a community hub for a run club. It serves as a central place for members to see what is happening, track events, and engage in friendly competition.

## Core Goals
1.  **Community Hub:** A single destination for all club-related information.
2.  **Live Leaderboard:** A real-time ranking of members based on ongoing challenges, powered by Strava data.
3.  **Event Tracking:** Visibility into future runs and social events.
4.  **Seamless Access:** Authentication is handled exclusively via Strava to reduce friction and ensure all members are verified athletes.

## Key Features (Phase 1)
*   **Strava-Only Login:** Users sign in with their existing Strava accounts. No separate email/password required.
*   **Automated Data Sync:** The app automatically pulls activity data from Strava to update leaderboards.
*   **Leaderboard UI:** Display rankings based on distance, elevation, or time for specific periods.

## Architecture Decisions
*   **Framework:** SvelteKit (SSR).
*   **Database:** Supabase (PostgreSQL) with Drizzle ORM.
*   **Authentication:** "Shadow User" pattern.
    *   Users authenticate via Strava OAuth.
    *   A corresponding "shadow" user is created/linked in Supabase Auth to handle sessions and security (RLS).
    *   The user experience is strictly "Connect with Strava".

## Future Considerations
*   Event RSVP system.
*   Club announcements/blog.
*   Photo sharing from runs.

## Current Implementation (dashboard branch)

- **Frontend & Server**: SvelteKit with Svelte 5 runes.
- **Persistence**: Supabase Postgres with Drizzle ORM; Strava connections and challenge data modeled in `src/lib/db/schema.ts`.
- **Auth**: Strava‑only login using a shadow‑user pattern; user profile is exposed as `App.Locals.profile` and surfaced in the dashboard UI.
- **Dashboard Architecture**: A `DashboardUI` class (via context) manages challenges, while each `ChallengeUI` owns its own `LeaderboardUI`. The leaderboard rows are built client‑side from participants/contributions, and Strava compliance (logo + links) is implemented per `docs/strava_compliance.md` and `docs/strava_compliance_implementation.md`.

