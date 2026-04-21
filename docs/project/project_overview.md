# Project Overview: Washed Up Coffee Club

**Use this first** when starting a new chat or onboarding. For schema, compliance, and implementation details, see [`project_context.md`](./project_context.md).

---

## What It Is

Web app for a **local running club**: community hub, live leaderboards from Strava, and event visibility. Auth is **Strava-only** (no email/password). Goal: one place for members to see what's happening and compete in time-bound challenges (e.g. "Flash Challenge" — complete a half marathon in 24 hours).

## Tech Stack

| Layer       | Choice                                                      |
| ----------- | ----------------------------------------------------------- |
| Frontend    | SvelteKit, **Svelte 5 (Runes)**                             |
| Backend     | SvelteKit (API routes, loaders)                             |
| Database    | Supabase (PostgreSQL)                                       |
| ORM         | Drizzle                                                     |
| Auth        | Strava OAuth → "shadow" user in Supabase for sessions + RLS |
| Data source | Strava API (read profile + activities)                      |

## Architecture Highlights

- **Strava-only login:** "Connect with Strava" only; Supabase user is created/linked for session and RLS.
- **Feature colocation:** Route-scoped logic in `src/routes/[feature]/_logic/`, components in `_components/`. Shared/generic code in `src/lib/`.
- **Smart objects:** Data is hydrated into TypeScript classes (e.g. `DashboardUI`, `ChallengeUI`, `LeaderboardUI`); components receive class instances, not raw DB rows.
- **State:** Svelte 5 runes (`$state`, `$derived`, `$effect`) and Context API within a route; no legacy stores.

## Main Routes

- **`/`** — Public landing; "Connect with Strava" CTA.
- **`/dashboard`** — Protected; challenge list, countdown, leaderboard (completed vs pending).
- **`/admin`** — Protected, admin-only; create challenges, manage content, force sync.

## Critical Constraint: Strava Compliance

The app targets Strava "Community Application" status. Rules that must stay correct:

- **User scale:** Local club only (<100 users).
- **Data:** Only shown to users who authenticated via Strava; no public leaderboard links.
- **Attribution:** Official orange "Connect with Strava" on login; "Powered by Strava" in leaderboard footer; athlete names and activities must link to Strava.

Details: [`strava_compliance.md`](../strava_compliance.md), [`strava_compliance_implementation.md`](../strava_compliance_implementation.md).

## Other Docs (by topic)

- **Full context for AI/other chats:** [`project_context.md`](./project_context.md) — schema summary, auth flow, webhooks, admin workflow, file map.
- **Strava webhook:** [`strava_webhook.md`](../strava/strava_webhook.md) — how the webhook pipeline works, setup, and key files.
- **Svelte 5 + patterns:** `.cursor/rules/Svelte-5-Standards.mdc` in repo root.
- **Backlog (future work):** [`docs/backlog/`](../backlog/) — admin dashboard plan, contribution recalculation options, dashboard data refactor, challenge UI consolidation, logging improvements.
- **Auth:** [`auth.md`](./auth.md) — Strava-only login, Shadow User pattern, key files.
