# Dashboard: Reactive UX Enhancements (Future)

## Overview

Enhancements to make the dashboard more reactive and responsive: (1) make `distanceUnit` reactive from `UserPreferences` instead of a constructor param, and (2) add Supabase Realtime subscriptions for the active challenge leaderboard so updates from other users appear without refresh.

## Current State

- `DashboardUI.distanceUnit` is set at construction; does not update when user changes preference
- Leaderboard updates only when user triggers a form action or when server data is re-fetched
- No real-time updates when another user joins a challenge or completes a run

## Requirements

### 1. Reactive Distance Unit

- `DashboardUI.distanceUnit` becomes `$derived(getUserPreferencesContext().distanceUnit)` instead of constructor param
- Refactor `ChallengeUI` and `LeaderboardUI` to receive unit reactively (from context or parent)
- When user toggles mi/km, dashboard updates immediately

### 2. Supabase Realtime for Leaderboard

- Subscribe to `challenge_participants` and `challenge_contributions` for the active challenge
- On insert/update: call `invalidate('dashboard')` or a custom refresh to re-fetch and sync
- Enables multi-user experience: users see each other's progress without manual refresh

## Implementation Notes

- **Reactive unit:** Requires refactoring `DashboardUI`, `ChallengeUI`, `LeaderboardUI` to read from context. See [distance-unit-preference-localstorage.md](./distance-unit-preference-localstorage.md) for related work.
- **Realtime:** Requires Supabase client setup, RLS policies for subscriptions, and careful invalidation strategy to avoid stale data.
- **Priority:** Future — Phase 4 in dashboard-improvements-plan.md

## Related Docs

- [dashboard-improvements-plan.md](../dashboard-improvements-plan.md) — Section 4.2, 4.3, Phase 4
- [distance-unit-preference-localstorage.md](./distance-unit-preference-localstorage.md) — Persistence and toggle UI
