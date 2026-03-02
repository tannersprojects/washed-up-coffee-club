# Leaderboard: Extract Status Helpers

## Overview

Extract `getStatusColor` and `getMobileStatusLabel` from `LeaderboardRow.svelte` into a shared utility module for reuse across the app.

## Current State

- `LeaderboardRow.svelte` defines `getStatusColor(status)` and `getMobileStatusLabel(status)` inline
- Both use `PARTICIPANT_STATUS` constants
- No other components currently use these helpers.

## Requirements

- Create `src/lib/utils/participant.ts` (or `$lib/utils/leaderboard.ts`)
- Move `getStatusColor` and `getMobileStatusLabel` to the new module
- Export and use them in `LeaderboardRow.svelte`
- Ensures consistent status display if other components need similar logic (e.g. admin, mobile views)

## Implementation Notes

- **Files to create:** `src/lib/utils/participant.ts`
- **Files to update:** `src/routes/(app)/dashboard/_components/leaderboard/LeaderboardRow.svelte`
- **Priority:** Optional — low impact; improves DRY and maintainability

## Related Docs

- [dashboard-improvements-plan.md](../dashboard-improvements-plan.md) — Section 1.6
