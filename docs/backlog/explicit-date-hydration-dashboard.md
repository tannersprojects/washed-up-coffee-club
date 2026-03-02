# Dashboard: Explicit Date Hydration

## Overview

Explicitly parse dates at the data load/hydration boundary when passing dashboard data from server to client. SvelteKit serializes load data to JSON (dates become ISO strings); parsing ensures `Date` objects are always used in client code.

## Current State

- `ChallengeUI` assigns `this.startDate = challenge.startDate` and `this.endDate = challenge.endDate` directly
- `getChallengeTimeStateFromDates` accepts `Date | string` via `new Date()`, so it works implicitly
- No explicit parsing at the boundary; relies on downstream consumers to handle strings

## Requirements

- In `DashboardUI.fromServerData` or `ChallengeUI` constructor: explicitly parse date fields
- Example: `startDate: new Date(challenge.startDate)`, `endDate: new Date(challenge.endDate)`
- Apply to any date fields in `DashboardChallenge` and participant/contribution data
- Ensures type consistency and robustness if serialization shapes change

## Implementation Notes

- **Files to update:** `src/routes/(app)/dashboard/_logic/DashboardUI.svelte.ts`, `ChallengeUI.svelte.ts`, or a dedicated hydration helper
- **Priority:** Low — current implicit handling works; this is a robustness improvement

## Related Docs

- [dashboard-improvements-plan.md](../dashboard-improvements-plan.md) — Section 2.4, 3.2, Phase 3
