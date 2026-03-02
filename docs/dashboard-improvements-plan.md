# Dashboard Improvements Plan

**Created:** 2025-02-26  
**Status:** Planning  
**Scope:** Code review remediation, DTO/data flow optimization, reactive UX

This document consolidates a detailed plan to address dashboard code review findings, analyze and improve data transfer objects (DTOs), and establish best practices for a reactive user experience from Supabase (via Drizzle) to the frontend.

---

## Table of Contents

1. [Code Review Remediation Plan](#1-code-review-remediation-plan)
2. [Data Transfer Objects (DTOs) Analysis](#2-data-transfer-objects-dtos-analysis)
3. [Data Flow: Supabase → Frontend](#3-data-flow-supabase--frontend)
4. [Reactive Experience Strategy](#4-reactive-experience-strategy)
5. [Implementation Phases](#5-implementation-phases)

---

## 1. Code Review Remediation Plan

### 1.1 Error Handling (High Priority)

**Issue:** Form action errors (join/leave challenge) are not surfaced to users. On `fail(400)` or `fail(500)`, `challenge.isSubmitting` is reset but the user sees nothing.

**Current state:**
- `JoinChallengeButton.svelte` and `ChallengeHero.svelte` (leave form) only handle `result.type === 'success'`
- In the `else` branch, `challenge.isSubmitting = false` is set but no error message is displayed

**Remediation:**

1. **Use existing toast system.** The app already uses `svelte-sonner` (see `src/routes/+layout.svelte` with `<Toaster />`, and admin components like `ChallengeCard.svelte`, `ScheduleForm.svelte`).

2. **Handle `result.type === 'failure'`** in SvelteKit form enhance callbacks. SvelteKit returns `{ type: 'failure', data: { error?: string } }` when `fail()` is used.

3. **Show errors via toast.** When `result.type === 'failure'`, call `toast.error(result.data?.error ?? 'Something went wrong. Please try again.')` — no need for `errorMessage` state or inline UI.

4. **Reset `isSubmitting`** in the `else` branch (already done).

**Files to change:**
- `src/routes/(app)/dashboard/_components/challenges/JoinChallengeButton.svelte` — import `toast` from `svelte-sonner`, handle `result.type === 'failure'` with `toast.error()`
- `src/routes/(app)/dashboard/_components/challenges/ChallengeHero.svelte` — same for leave form

---

### 1.2 Accessibility (Medium Priority)

**Issue:** ChallengesDrawer overlay and drawer lack proper ARIA and focus management.

**Remediation:**

1. **Overlay:** Change `role="button"` to `role="presentation"` or remove. The overlay is a backdrop, not a button.

2. **Drawer panel:** Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the "Challenges" heading.

3. **Focus trap:** When drawer opens, focus the first focusable element (close button or first challenge). When closed, restore focus to the trigger button. Use `$effect` that:
   - On open: focus first element inside drawer
   - On close: `triggerButtonRef?.focus()`

4. **Escape key:** Already handled; keep it.

**Files to change:**
- `src/routes/(app)/dashboard/_components/challenges/ChallengesDrawer.svelte`
- `src/routes/(app)/dashboard/+page.svelte` — add `bind:this={drawerTriggerRef}` to the Menu button for focus restore

---

### 1.3 Lifecycle & Cleanup (Medium Priority)

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

**Files to change:**
- `src/routes/(app)/dashboard/+page.svelte`

---

### 1.4 User Preferences Context (Medium Priority)

**Issue:** `setUserPreferencesContext()` is called on every layout render, creating a new `UserPreferences` instance each time. Any in-memory preference changes (e.g. `distanceUnit`) are lost on navigation.

**Remediation:**

1. **Use `untrack` like admin.** In `+layout.svelte`, mirror the pattern from `admin/+page.svelte`:
   ```ts
   import { untrack } from 'svelte';
   untrack(() => setUserPreferencesContext());
   ```
   This ensures the context initialization is not reactive to layout re-renders.

2. **Make `setUserPreferencesContext` idempotent.** Update `user-preferences.svelte.ts` so it returns the existing instance if already set (e.g. module-level singleton), rather than creating a new `UserPreferences` on every call. That way, even if the layout re-runs, the same instance is reused.

3. **Persist preferences.** See `docs/backlog/distance-unit-preference-localstorage.md`. Implement localStorage persistence so preferences survive reloads and navigation.

**Files to change:**
- `src/routes/(app)/+layout.svelte` — use `untrack(() => setUserPreferencesContext())`
- `src/lib/state/user-preferences.svelte.ts` — make idempotent (singleton or return-existing), localStorage read/write

---

### 1.5 Server Action Error Messages (Low Priority)

**Issue:** `leaveChallenge` returns `Failed to leave challenge: ${error}` — exposing internal error details. Also, 401 message says "join" instead of "leave".

**Remediation:**

1. **Generic user-facing messages.** Use `fail(500, { error: 'Failed to leave challenge. Please try again.' })` — do not interpolate `error`.

2. **Log server-side.** `console.error('Error leaving challenge:', error)` before returning.

3. **Fix 401 message.** Use "You must be logged in to leave a challenge" in `leaveChallenge`.

**Files to change:**
- `src/routes/(app)/dashboard/+page.server.ts`

---

### 1.6 Type Safety in LeaderboardRow (Low Priority)

**Issue:** `row.participant.status` is compared to string literals (`'completed'`, `'in_progress'`) instead of `PARTICIPANT_STATUS` constants.

**Remediation:**

1. **Use constants.** Import `PARTICIPANT_STATUS` and use `PARTICIPANT_STATUS.COMPLETED`, etc.

2. **Extract helpers.** Move `getStatusColor` and `getMobileStatusLabel` to `$lib/utils/participant.ts` or `$lib/utils/leaderboard.ts` for reuse.

**Files to change:**
- `src/routes/(app)/dashboard/_components/leaderboard/LeaderboardRow.svelte`
- Create `src/lib/utils/participant.ts` (optional)

---

## 2. Data Transfer Objects (DTOs) Analysis

### 2.1 Current DTO Layer

The dashboard uses **implicit DTOs** — types that mirror the database schema with extensions. There is no explicit DTO layer; types are derived from Drizzle schema + ad-hoc extensions.

| Type | Source | Purpose |
|------|--------|---------|
| `Challenge` | Drizzle `InferSelectModel` | Raw DB row |
| `ChallengeWithParticipation` | `Challenge & { isParticipating, participant }` | Challenge + user's participation status |
| `ChallengeParticipantWithRelations` | `ChallengeParticipant & { profile, contributions }` | Participant with joined relations |
| `LeaderboardRowData` | Manual type | Flattened row for leaderboard display |
| `ChallengeStats` | Interface | Derived stats for stats grid |
| `DashboardContextData` | Type | Loader payload shape |

### 2.2 Strengths of Current Approach

- **Single source of truth:** Drizzle schema drives base types; no duplicate definitions.
- **Colocation:** Types live in `$lib/types/dashboard.ts`; easy to find.
- **Hydration at boundary:** Raw data is hydrated into `ChallengeUI`, `LeaderboardUI` classes at the context boundary. Components never receive raw DB rows.

### 2.3 Weaknesses

1. **No explicit serialization contract.** SvelteKit serializes load data to JSON. Dates become ISO strings. The code assumes `getChallengeTimeStateFromDates(startDate, endDate)` accepts both `Date` and `string` — it does, but this is implicit.

2. **Two parallel structures.** `challengesWithParticipation` (array) and `challengeParticipantsWithRelationsByChallenge` (record) must stay in sync. Risk of missing keys (see `docs/backlog/dashboard_data_structure_refactor.md`).

3. **Over-fetching.** The loader fetches all participants for all challenges. For a user with many challenges, this could be large. No pagination or lazy-loading.

4. **No DTO validation.** Data from the server is trusted. No runtime validation (e.g. Zod) at the boundary.

### 2.4 Recommended DTO Strategy

**Option A: Explicit DTO types with serialization helpers (recommended)**

- Define `DashboardLoadData` as the *serialized* shape (dates as ISO strings).
- Add `hydrateDashboardData(data: DashboardLoadData): DashboardContextData` that converts dates and validates structure.
- Use in `setDashboardContext`: `setDashboardContext(hydrateDashboardData(data))`.

**Option B: Single array (from backlog)**

- Adopt `ChallengeWithParticipationAndParticipants` — each challenge carries its own `participants` array.
- Eliminates the record; simplifies types and reduces sync bugs.
- See `docs/backlog/dashboard_data_structure_refactor.md`.

**Option C: Add Zod validation**

- Define Zod schemas for `DashboardContextData` (or the load payload).
- Validate in `load` or at hydration. Fail fast if shape is wrong.

**Recommendation:** Combine A + B. Implement Option B (single array) for structural simplicity, then add Option A (explicit hydration with date parsing) for robustness.

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

| Enhancement | Effort | Impact | Priority |
|-------------|--------|--------|----------|
| Form error display | Low | High | P1 |
| User preferences persistence + reactive unit | Medium | Medium | P2 |
| Supabase Realtime for leaderboard | High | High | P3 (future) |
| Dashboard cleanup on unmount | Low | Low | P1 |
| Explicit date hydration in DTOs | Low | Medium | P2 |

---

## 5. Implementation Phases

### Phase 1: Quick Wins (1–2 days)

- [ ] Add error handling to Join/Leave forms (1.1)
- [ ] Call `dashboard.cleanup()` in `onDestroy` (1.3)
- [ ] Fix leaveChallenge error message and 401 text (1.5)
- [ ] Use PARTICIPANT_STATUS constants in LeaderboardRow (1.6)

### Phase 2: Accessibility & Context (1–2 days)

- [ ] ChallengesDrawer ARIA and focus trap (1.2)
- [ ] User preferences context: initialize once (1.4)
- [ ] User preferences: localStorage persistence (see backlog doc)

### Phase 3: DTO & Data Flow (2–3 days)

- [ ] Implement Option B: single array `ChallengeWithParticipationAndParticipants` (see dashboard_data_structure_refactor.md)
- [ ] Add explicit date hydration in `DashboardUI.fromServerData` / `ChallengeUI` constructor
- [ ] Optional: Zod validation at load boundary

### Phase 4: Reactive UX (Future)

- [ ] Make `distanceUnit` reactive from UserPreferences
- [ ] Supabase Realtime for active challenge leaderboard (if needed for multi-user experience)

---

## Appendix: File Change Summary

| File | Changes |
|------|---------|
| `JoinChallengeButton.svelte` | Handle `result.type === 'failure'`, call `toast.error()` |
| `ChallengeHero.svelte` | Same for leave form |
| `ChallengesDrawer.svelte` | ARIA, focus trap, role fixes |
| `+page.svelte` | Add second `$effect` that returns `() => dashboard.cleanup()` for unmount |
| `+page.server.ts` | Fix leaveChallenge error message, 401 text |
| `+layout.svelte` | Use `untrack(() => setUserPreferencesContext())` |
| `user-preferences.svelte.ts` | Make idempotent (singleton), localStorage, setDistanceUnit |
| `LeaderboardRow.svelte` | Use PARTICIPANT_STATUS constants |
| `loader.server.ts` | Option B refactor (if Phase 3) |
| `types/dashboard.ts` | New types for Option B (if Phase 3) |
