# User Preferences: Idempotent Context

## Overview

Make `setUserPreferencesContext` idempotent so it returns the existing `UserPreferences` instance when the context is already set, rather than creating a new instance on every call. This prevents in-memory preference changes (e.g. `distanceUnit`) from being lost on layout re-renders or navigation.

## Current State

- `setUserPreferencesContext()` in `src/lib/state/user-preferences.svelte.ts` creates a new `UserPreferences()` on every call
- `+layout.svelte` uses `untrack(() => setUserPreferencesContext())` to avoid reactive re-runs, but the layout may still re-execute for other reasons
- Any in-memory preference changes are lost when a new instance is created

## Requirements

- Use a module-level singleton (or similar) so `setUserPreferencesContext` returns the existing instance if already set
- If context is not yet set: create instance, call `setContext`, return it
- If context is already set: return existing instance (do not overwrite with new context)

## Implementation Notes

- **Files to update:** `src/lib/state/user-preferences.svelte.ts`
- **Related:** [distance-unit-preference-localstorage.md](./distance-unit-preference-localstorage.md) — persistence and reactive unit

## Related Docs

- [dashboard-improvements-plan.md](../dashboard-improvements-plan.md) — Section 1.4
