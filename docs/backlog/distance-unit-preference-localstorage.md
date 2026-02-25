# Distance Unit Preference: localStorage + Reactive Toggle

## Overview

Persist the user's distance unit preference (miles vs kilometers) in localStorage and add a UI toggle to switch between units. The `UserPreferences` context and display logic are already in place; this task wires up persistence and the toggle.

## Current State

- `UserPreferences` class in `src/lib/state/user-preferences.svelte.ts` has `distanceUnit = $state(DISTANCE_UNIT.MILES)` (hardcoded)
- All dashboard components read `dashboard.distanceUnit` and format distances accordingly
- No persistence; preference resets on page reload
- No UI to change the preference

## Requirements

### 1. localStorage Persistence

- **Key:** `washed-up-coffee-club.distance-unit`
- **On app load:** Read from localStorage; if missing or invalid, default to `DISTANCE_UNIT.MILES`
- **On preference change:** Write to localStorage when user toggles unit

### 2. UserPreferences Updates

- Add `setDistanceUnit(unit: DistanceUnit)` method to `UserPreferences`
- In constructor: read from localStorage (client-side only; guard with `typeof window !== 'undefined'`)
- When `setDistanceUnit` is called: update `this.distanceUnit`, write to localStorage

### 3. Reactivity

- `distanceUnit` is already `$state`; changing it will trigger re-renders
- **Caveat:** `DashboardUI` receives `distanceUnit` at construction time. When the user toggles, `UserPreferences.distanceUnit` changes, but `DashboardUI` and its children were created with the initial value.
- **Solution:** Either (a) have `DashboardUI` read `distanceUnit` from `UserPreferences` reactively (e.g. `$derived(getUserPreferencesContext().distanceUnit)`), or (b) re-create the dashboard context when the preference changes. Option (a) is cleaner: `DashboardUI.distanceUnit` becomes `$derived(prefs.distanceUnit)` instead of a constructor param. This may require refactoring how `distanceUnit` flows to `ChallengeUI` and `LeaderboardUI` (they would need to read from context or receive it as a reactive source).

### 4. UI Toggle

- Add a toggle (e.g. in dashboard header, settings, or AppNav) to switch between mi/km
- On toggle: call `getUserPreferencesContext().setDistanceUnit(newUnit)`
- Ensure the toggle is only rendered client-side (localStorage is not available on server)

## Implementation Notes

- **SSR:** localStorage is not available during server render. Initialize `UserPreferences` with default (MILES); hydrate from localStorage in `$effect` or on mount.
- **Files to update:** `src/lib/state/user-preferences.svelte.ts`, dashboard context flow (if making unit reactive), new toggle component or integration into existing nav/settings.
- **Validation:** When reading from localStorage, validate the value is a valid `DistanceUnit`; fall back to MILES if not.
