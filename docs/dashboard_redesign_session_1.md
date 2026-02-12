# Dashboard Redesign — Session 1: Layout + Tabs

**Goal:** Introduce the dashboard tab shell (Challenges | Club Leaderboard) and a full-height layout. Challenges tab shows current content; Club Leaderboard tab shows placeholder. No sidebar yet.

**Definition of done:** Toggling between "Challenges" and "Club Leaderboard" works; both tabs render; layout is full-height within the app shell.

---

## 1. Overview

- Add a **dashboard-level layout** that wraps only `/dashboard` and provides:
  - A full-height flex column (taking remaining space below AppNav).
  - A **tab bar** at the top: "Challenges" | "Club Leaderboard".
  - A **content area** below the tabs that renders the active tab content.
- Add **active tab state** to dashboard context (no stores).
- **Challenges tab:** Keep existing behavior (empty state, or ChallengesList + Hero + Leaderboard, or single challenge Hero + Leaderboard).
- **Club Leaderboard tab:** Single placeholder view (e.g. "Club Leaderboard — coming soon").

---

## 2. Code Locations & Updates

### 2.1 Context & state: `activeTab`

**File:** `src/routes/(app)/dashboard/_logic/DashboardUI.svelte.ts`

- **Add** a reactive property for the active tab:
  - Type: `'challenges' | 'club-leaderboard'`.
  - Default: `'challenges'`.
  - Use `$state()` so it's reactive (e.g. `activeTab = $state<'challenges' | 'club-leaderboard'>('challenges')`).
- **Add** a method: `setActiveTab(tab: 'challenges' | 'club-leaderboard')` that sets `this.activeTab = tab`.

No other changes to `DashboardUI` in this session (e.g. no changes to `selectChallenge`, `challenges`, or `selectedChallengeId`).

---

### 2.2 Dashboard layout (new)

**File:** `src/routes/(app)/dashboard/+layout.svelte` (create new)

- This layout runs **only** for `/dashboard` (and any nested dashboard routes). It receives `data` and `children` from the layout chain.
- **Responsibilities:**
  1. Ensure dashboard context is set (same as page: call `setDashboardContext(data)` once, e.g. in a similar pattern to the page — use `untrack` so it runs once; the page also sets context today, so you may keep context setup in the page and have the layout only consume it via `getDashboardContext()`, **or** move context initialization into the layout so the layout and page both use `getDashboardContext()`. Prefer initializing in layout so the tab bar can read context.)
  2. Render structure:
     - Outer: `flex flex-1 flex-col w-full min-h-0` (so it fills the app main and can shrink for scroll).
     - Tab bar: horizontal bar with two buttons/links: "Challenges" and "Club Leaderboard". On click, call `dashboard.setActiveTab('challenges')` or `dashboard.setActiveTab('club-leaderboard')`. Style active tab (e.g. border-bottom or background using `var(--accent-lime)` or `var(--grey-olive)` per design).
     - Content area: `flex-1 min-h-0 overflow-auto` wrapping `{@render children()}`.
- **Design notes:** Use existing tokens from `src/routes/layout.css`: `--accent-lime`, `--grey-olive`, `--black`. Tab bar can be a simple row with `border-b border-white/10`; active tab `border-b-2 border-(--accent-lime)` and/or `text-(--accent-lime)`.
- **Context:** Layout must run in a component that has access to dashboard context. Context is currently set in `+page.svelte`. So either:
  - **Option A:** Initialize context in `+layout.svelte` (move the `untrack(() => setDashboardContext(data))` and the `$effect` for `updateFromServerData` into the layout), and have `+page.svelte` only use `getDashboardContext()`. Then the tab bar in the layout can call `dashboard.setActiveTab(...)`.
  - **Option B:** Keep context init in `+page.svelte` and have the layout receive a way to change tabs (e.g. slot or callback). Option A is cleaner: one place for context init, layout and page both read from context.

**Recommended:** Initialize dashboard context in `src/routes/(app)/dashboard/+layout.svelte` (with `untrack` and `$effect` for `updateFromServerData(data)`), and have `+page.svelte` only use `getDashboardContext()` and render tab content.

---

### 2.3 Dashboard page: tab content

**File:** `src/routes/(app)/dashboard/+page.svelte`

- **Remove** context initialization from the page (moved to layout): remove `untrack(() => setDashboardContext(data))` and the `$effect` that calls `dashboard.updateFromServerData(data)`. Instead, call `getDashboardContext()` at the top.
- **Data:** The page still receives `data` from the layout (layout forwards it). If the layout owns context init, the layout needs `data`; the page can get context via `getDashboardContext()` and does not need to pass `data` into context again (the layout’s `$effect` will keep context in sync).
- **Structure:** Wrap the entire content in a conditional on `dashboard.activeTab`:
  - `{#if dashboard.activeTab === 'club-leaderboard'}`
    - Render the Club Leaderboard placeholder (e.g. a simple div or reuse `EmptyState`-style layout with a message like "Club Leaderboard — coming soon" or "All-time club leaderboard. Data and design coming in a future update.")
  - `{:else}`
    - Current content: `{#if dashboard.challenges.length === 0}` → EmptyState; `{:else}` → optional ChallengesList (when > 1) + ChallengeHero + LeaderboardSection when `dashboard.selectedChallenge`; end with `<DashboardFooter />`.
- **Footer:** Keep `<DashboardFooter />` visible on both tabs (or only on Challenges — specify per product; "both" is a safe default so Strava attribution is always present).

---

### 2.4 App layout (optional tweak)

**File:** `src/routes/(app)/+layout.svelte`

- The dashboard needs to fill available height. Current `<main class="relative flex flex-1 flex-col items-center pt-24 pb-20">` uses `flex-1` and `flex-col items-center`. For the dashboard child to be full-height, the main should allow the child to grow. Ensure the main has `min-h-0` if it’s inside a flex container so the dashboard layout can shrink and scroll. Check parent: the root div is `flex min-h-screen flex-col`; main is `flex-1 flex-col`. Adding `min-h-0` to `main` can help: `class="relative flex min-h-0 flex-1 flex-col items-center pt-24 pb-20"`. This is a small change; only do it if the dashboard content area doesn’t fill height as expected.

---

## 3. File Summary

| Action | File                                                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Edit   | `src/routes/(app)/dashboard/_logic/DashboardUI.svelte.ts` — add `activeTab` state and `setActiveTab()`.                              |
| Create | `src/routes/(app)/dashboard/+layout.svelte` — tab bar, content area, context init (optional: move from page).                        |
| Edit   | `src/routes/(app)/dashboard/+page.svelte` — use `getDashboardContext()`, branch on `activeTab`, render Club Leaderboard placeholder. |
| Edit   | `src/routes/(app)/+layout.svelte` — optional: add `min-h-0` to main for correct flex behavior.                                       |

---

## 4. Testing Checklist

- [ ] Navigate to `/dashboard`. Tab bar shows "Challenges" and "Club Leaderboard"; Challenges is active.
- [ ] With at least one challenge, Challenges tab shows hero + leaderboard (and challenge list if multiple).
- [ ] With zero challenges, Challenges tab shows empty state ("No Active Challenge").
- [ ] Click "Club Leaderboard". Content switches to placeholder; no errors.
- [ ] Click "Challenges". Content returns to challenges view.
- [ ] Footer (e.g. Strava attribution) appears as intended on both tabs.
- [ ] Layout fills the viewport below the app nav (no unnecessary white space or double scrollbars).

---

## 5. References

- Dashboard context: `src/routes/(app)/dashboard/_logic/context.ts` — `setDashboardContext`, `getDashboardContext`.
- Design tokens: `src/routes/layout.css` — `--accent-lime`, `--grey-olive`, `--black`, `--white`.
- Project rules: Svelte 5 runes, Context API, no stores (`.cursor/rules/Svelte-5-Standards.mdc`).
