# Dashboard Improvements Plan

**Created:** 2025-02-26  
**Status:** In Progress  
**Scope:** Code review remediation, DTO/data flow optimization, reactive UX

This document consolidates a detailed plan to address dashboard code review findings, analyze and improve data transfer objects (DTOs), and establish best practices for a reactive user experience from Supabase (via Drizzle) to the frontend.

---

## Implementation Status (as of 2025-03-04)

### Completed

| Item                                                            | Phase   |
| --------------------------------------------------------------- | ------- |
| 1.1 Error handling (Join/Leave forms)                           | Phase 1 |
| 1.2 ChallengesDrawer ARIA and focus trap                        | Phase 2 |
| 1.3 Dashboard cleanup on unmount                                | Phase 1 |
| 1.4 User preferences: `untrack` in layout                       | Phase 2 |
| 1.5 Server action error messages (leaveChallenge)               | Phase 1 |
| 1.6 PARTICIPANT_STATUS constants in LeaderboardRow              | Phase 1 |
| Option B: Single array `DashboardChallenge` with `participants` | Phase 3 |

### Remaining

| Item                                                                 | Phase   |
| -------------------------------------------------------------------- | ------- |
| 1.4 User preferences: Make `setUserPreferencesContext` idempotent    | Phase 2 |
| 1.4 User preferences: localStorage persistence                       | Phase 2 |
| Explicit date hydration in `DashboardUI` / `ChallengeUI`             | Phase 3 |
| Optional: Zod validation at load boundary                            | Phase 3 |
| Optional: Extract `getStatusColor` / `getMobileStatusLabel` to utils | Phase 1 |
| Make `distanceUnit` reactive from UserPreferences                    | Phase 4 |
| Supabase Realtime for leaderboard                                    | Phase 4 |

---

## Table of Contents

1. [Implementation Status](#implementation-status-as-of-2025-03-04)
2. [Code Review Remediation Plan](#1-code-review-remediation-plan)
3. [Data Transfer Objects (DTOs) Analysis](#2-data-transfer-objects-dtos-analysis)
4. [Data Flow: Supabase → Frontend](#3-data-flow-supabase--frontend)
5. [Reactive Experience Strategy](#4-reactive-experience-strategy)
6. [Implementation Phases](#5-implementation-phases)

---

## 1. Code Review Remediation Plan

### 1.1 Error Handling (High Priority) — DONE

**Issue:** Form action errors (join/leave challenge) are not surfaced to users. On `fail(400)` or `fail(500)`, `challenge.isSubmitting` is reset but the user sees nothing.

**Current state:** Implemented. `JoinChallengeButton.svelte` and `LeaveChallengeButton.svelte` use `getFormActionError(result)` and `toast.error()` in the failure branch.

**Remediation (completed):**

1. **Use existing toast system.** The app already uses `svelte-sonner` (see `src/routes/+layout.svelte` with `<Toaster />`, and admin components like `ChallengeCard.svelte`, `ScheduleForm.svelte`).

2. **Handle `result.type === 'failure'`** in SvelteKit form enhance callbacks. SvelteKit returns `{ type: 'failure', data: { error?: string } }` when `fail()` is used.

3. **Show errors via toast.** When `result.type === 'failure'`, call `toast.error(result.data?.error ?? 'Something went wrong. Please try again.')` — no need for `errorMessage` state or inline UI.

4. **Reset `isSubmitting`** in the `else` branch (already done).

**Files changed:** `JoinChallengeButton.svelte`, `LeaveChallengeButton.svelte`

---

### 1.2 Accessibility (Medium Priority) — DONE

**Issue:** ChallengesDrawer overlay and drawer lack proper ARIA and focus management.

**Remediation:**

1. **Overlay:** Change `role="button"` to `role="presentation"` or remove. The overlay is a backdrop, not a button.

2. **Drawer panel:** Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the "Challenges" heading.

3. **Focus trap:** When drawer opens, focus the first focusable element (close button or first challenge). When closed, restore focus to the trigger button. Use `$effect` that:
   - On open: focus first element inside drawer
   - On close: `triggerButtonRef?.focus()`

4. **Escape key:** Already handled; keep it.

**Files changed:** `ChallengesDrawer.svelte`, `+page.svelte`

---

### 1.3 Lifecycle & Cleanup (Medium Priority) — DONE

**Issue:** `DashboardUI.cleanup()` exists but is never called. Countdown timers continue running when the user navigates away.

**Remediation:**

Use `$effect` with a cleanup return. Svelte 5's `$effect` runs the returned function when the effect re-runs or when the component unmounts. Use a **separate effect** for cleanup so we don't stop countdowns when `data` changes (only on unmount):

```ts
const dashboard = untrack(() => setDashboardContext(data));

$effect(() => {
	dashboard.updateFromServerData(data);
});

$effect(() => {
	return () => dashboard.cleanup();
});
```

The second effect has no dependencies, so it runs once on mount and returns a cleanup. When the page unmounts, that cleanup runs and stops all countdown timers. The first effect continues to sync server data on `data` changes without touching countdowns.

**Files changed:** `+page.svelte`

---

### 1.4 User Preferences Context (Medium Priority) — PARTIAL

**Issue:** `setUserPreferencesContext()` is called on every layout render, creating a new `UserPreferences` instance each time. Any in-memory preference changes (e.g. `distanceUnit`) are lost on navigation.

**Current state:** `untrack` is done in `(app)/+layout.svelte`. Idempotent and localStorage still pending.

**Remediation:**

1. **Use `untrack` like admin.** — DONE. In `+layout.svelte`:

   ```ts
   import { untrack } from 'svelte';
   untrack(() => setUserPreferencesContext());
   ```

   This ensures the context initialization is not reactive to layout re-renders.

2. **Make `setUserPreferencesContext` idempotent.** — PENDING. Update `user-preferences.svelte.ts` so it returns the existing instance if already set (e.g. module-level singleton), rather than creating a new `UserPreferences` on every call. That way, even if the layout re-runs, the same instance is reused.

3. **Persist preferences.** — PENDING. See `docs/backlog/distance-unit-preference-localstorage.md`. Implement localStorage persistence so preferences survive reloads and navigation.

**Files to change:**

- `src/lib/state/user-preferences.svelte.ts` — make idempotent (singleton or return-existing), localStorage read/write

---

### 1.5 Server Action Error Messages (Low Priority) — DONE

**Issue:** `leaveChallenge` returns `Failed to leave challenge: ${error}` — exposing internal error details. Also, 401 message says "join" instead of "leave".

**Remediation:**

1. **Generic user-facing messages.** Use `fail(500, { error: 'Failed to leave challenge. Please try again.' })` — do not interpolate `error`.

2. **Log server-side.** `console.error('Error leaving challenge:', error)` before returning.

3. **Fix 401 message.** Use "You must be logged in to leave a challenge" in `leaveChallenge`.

**Files changed:** `+page.server.ts`

---

### 1.6 Type Safety in LeaderboardRow (Low Priority) — DONE

**Issue:** `row.participant.status` is compared to string literals (`'completed'`, `'in_progress'`) instead of `PARTICIPANT_STATUS` constants.

**Remediation:**

1. **Use constants.** Import `PARTICIPANT_STATUS` and use `PARTICIPANT_STATUS.COMPLETED`, etc.

2. **Extract helpers.** — PENDING (optional). Move `getStatusColor` and `getMobileStatusLabel` to `$lib/utils/participant.ts` or `$lib/utils/leaderboard.ts` for reuse.

**Files changed:** `LeaderboardRow.svelte` (constants done). Optional: create `participant.ts`.

---

## 2. Data Transfer Objects (DTOs) Analysis

### 2.1 Current DTO Layer

The dashboard uses **implicit DTOs** — types that mirror the database schema with extensions. There is no explicit DTO layer; types are derived from Drizzle schema + ad-hoc extensions.

| Type                                | Source                                              | Purpose                                 |
| ----------------------------------- | --------------------------------------------------- | --------------------------------------- |
| `Challenge`                         | Drizzle `InferSelectModel`                          | Raw DB row                              |
| `ChallengeWithParticipation`        | `Challenge & { isParticipating, participant }`      | Challenge + user's participation status |
| `ChallengeParticipantWithRelations` | `ChallengeParticipant & { profile, contributions }` | Participant with joined relations       |
| `LeaderboardRowData`                | Manual type                                         | Flattened row for leaderboard display   |
| `ChallengeStats`                    | Interface                                           | Derived stats for stats grid            |
| `DashboardContextData`              | Type                                                | Loader payload shape                    |

### 2.2 Strengths of Current Approach

- **Single source of truth:** Drizzle schema drives base types; no duplicate definitions.
- **Colocation:** Types live in `$lib/types/dashboard.ts`; easy to find.
- **Hydration at boundary:** Raw data is hydrated into `ChallengeUI`, `LeaderboardUI` classes at the context boundary. Components never receive raw DB rows.

### 2.3 Weaknesses

1. **No explicit serialization contract.** SvelteKit serializes load data to JSON. Dates become ISO strings. The code assumes `getChallengeTimeStateFromDates(startDate, endDate)` accepts both `Date` and `string` — it does, but this is implicit.

2. **Two parallel structures.** — RESOLVED. Option B implemented: `DashboardChallenge` carries `participants` array; single array structure.

3. **Over-fetching.** The loader fetches all participants for all challenges. For a user with many challenges, this could be large. No pagination or lazy-loading.

4. **No DTO validation.** Data from the server is trusted. No runtime validation (e.g. Zod) at the boundary.

### 2.4 Recommended DTO Strategy

**Option A: Explicit DTO types with serialization helpers (recommended)**

- Define `DashboardLoadData` as the _serialized_ shape (dates as ISO strings).
- Add `hydrateDashboardData(data: DashboardLoadData): DashboardContextData` that converts dates and validates structure.
- Use in `setDashboardContext`: `setDashboardContext(hydrateDashboardData(data))`.

**Option B: Single array (from backlog)** — DONE

- Adopted `DashboardChallenge` — each challenge carries its own `participants` array.
- Eliminates the record; simplifies types and reduces sync bugs.

**Option C: Add Zod validation**

- Define Zod schemas for `DashboardContextData` (or the load payload).
- Validate in `load` or at hydration. Fail fast if shape is wrong.

**Recommendation:** Combine A + B. Option B implemented. Option A (explicit hydration with date parsing) still pending.

---

## 3. Data Flow: Supabase → Frontend

### 3.1 Current Flow

```
Supabase (PostgreSQL)
    ↓ Drizzle ORM
loader.server.ts (loadDashboardData)
    ↓ Returns DashboardContextData
+page.server.ts load()
    ↓ SvelteKit serializes to JSON (dates → ISO strings)
+page.svelte (data prop)
    ↓ setDashboardContext(data)
context.ts (setDashboardContext)
    ↓ getUserPreferencesContext(), DashboardUI.fromServerData()
DashboardUI constructor
    ↓ new ChallengeUI(...) for each challenge
ChallengeUI, LeaderboardUI (hydrated classes)
    ↓ getDashboardContext()
Components (reactive via $derived)
```

### 3.2 Serialization Considerations

- **Dates:** Drizzle returns `Date` objects. SvelteKit's `load` serializes to JSON for the client. Dates become ISO 8601 strings. The `ChallengeUI` constructor assigns `startDate` and `endDate` directly — they may be strings on the client. `getChallengeTimeStateFromDates` accepts `Date | string` via `new Date()`, so it works. **Recommendation:** Explicitly parse in hydration: `startDate: new Date(c.startDate)`.

- **Null/undefined:** JSON does not distinguish. Ensure optional fields are handled (e.g. `goalDistance` can be `null`).

### 3.3 Mutation Flow (Join/Leave)

```
User clicks Join
    ↓ Form POST ?/joinChallenge
+page.server.ts action
    ↓ joinChallenge(), loadChallengeParticipantWithRelations()
Returns { success: true, challengeParticipantWithRelations }
    ↓ use:enhance callback
ChallengeUI.join(participant) — optimistic update
    ↓ await update()
SvelteKit re-runs load()
    ↓ data prop updates
$effect in +page.svelte
    ↓ dashboard.updateFromServerData(data)
ChallengeUI.updateFromServerData() — sync with server
```

**Strength:** Optimistic update + server sync gives instant feedback and eventual consistency.

---

## 4. Reactive Experience Strategy

### 4.1 Current Reactivity Model

- **$state** in `DashboardUI`, `ChallengeUI`, `LeaderboardUI` for mutable state.
- **$derived** for computed values (e.g. `selectedChallenge`, `leaderboardRows`, `challengeTimeState`).
- **$effect** in `+page.svelte` to sync `dashboard.updateFromServerData(data)` when server data changes.
- **Context API** to share `DashboardUI` and `UserPreferences` without prop drilling.

### 4.2 Gaps for "Best Possible" Reactive Experience

1. **No real-time updates.** When another user joins a challenge or completes a run, the current user does not see it until they refresh or trigger a form action. **Solution:** Supabase Realtime subscriptions on `challenge_participants` and `challenge_contributions` for the active challenge. On insert/update, call `invalidate('dashboard')` or a custom refresh.

2. **Distance unit not reactive.** `DashboardUI.distanceUnit` is set at construction. If user changes preference, dashboard does not update. **Solution:** Have `DashboardUI.distanceUnit` be `$derived(getUserPreferencesContext().distanceUnit)` instead of a constructor param. Requires refactoring `ChallengeUI` and `LeaderboardUI` to receive unit reactively (e.g. from context or parent).

3. **Countdown not reactive across tabs.** If user switches browser tabs and returns, the countdown may be stale (setInterval runs but could drift). **Solution:** Recalculate on `visibilitychange` or use `requestAnimationFrame` for critical countdowns. Lower priority.

### 4.3 Recommended Reactive Enhancements

| Enhancement                                  | Effort | Impact | Priority    |
| -------------------------------------------- | ------ | ------ | ----------- |
| Form error display                           | Low    | High   | P1          |
| User preferences persistence + reactive unit | Medium | Medium | P2          |
| Supabase Realtime for leaderboard            | High   | High   | P3 (future) |
| Dashboard cleanup on unmount                 | Low    | Low    | P1          |
| Explicit date hydration in DTOs              | Low    | Medium | P2          |

---

## 5. Implementation Phases

### Phase 1: Quick Wins (1–2 days)

- [x] Add error handling to Join/Leave forms (1.1)
- [x] Call `dashboard.cleanup()` in `$effect` on unmount (1.3)
- [x] Fix leaveChallenge error message and 401 text (1.5)
- [x] Use PARTICIPANT_STATUS constants in LeaderboardRow (1.6)

### Phase 2: Accessibility & Context (1–2 days)

- [x] ChallengesDrawer ARIA and focus trap (1.2)
- [x] User preferences context: `untrack` in layout (1.4.1)
- [ ] User preferences: make `setUserPreferencesContext` idempotent (1.4.2)
- [ ] User preferences: localStorage persistence (see backlog doc)

### Phase 3: DTO & Data Flow (2–3 days)

- [x] Implement Option B: single array `DashboardChallenge` with `participants`
- [ ] Add explicit date hydration in `DashboardUI.fromServerData` / `ChallengeUI` constructor
- [ ] Optional: Zod validation at load boundary

### Phase 4: Reactive UX (Future)

- [ ] Make `distanceUnit` reactive from UserPreferences
- [ ] Supabase Realtime for active challenge leaderboard (if needed for multi-user experience)

---

## Appendix: File Change Summary

| File                          | Changes                                                                   | Status  |
| ----------------------------- | ------------------------------------------------------------------------- | ------- |
| `JoinChallengeButton.svelte`  | Handle `result.type === 'failure'`, call `toast.error()`                  | Done    |
| `LeaveChallengeButton.svelte` | Same for leave form                                                       | Done    |
| `ChallengesDrawer.svelte`     | ARIA, focus trap, role fixes                                              | Done    |
| `+page.svelte`                | Add second `$effect` that returns `() => dashboard.cleanup()` for unmount | Done    |
| `+page.server.ts`             | Fix leaveChallenge error message, 401 text                                | Done    |
| `(app)/+layout.svelte`        | Use `untrack(() => setUserPreferencesContext())`                          | Done    |
| `user-preferences.svelte.ts`  | Make idempotent (singleton), localStorage, setDistanceUnit                | Pending |
| `LeaderboardRow.svelte`       | Use PARTICIPANT_STATUS constants                                          | Done    |
| `loader.server.ts`            | Option B refactor (single array)                                          | Done    |
| `types/dashboard.ts`          | `DashboardChallenge` with `participants`                                  | Done    |
