# Dashboard Refactor Plan

## Phase 1: Quick Wins (Low Risk)

### 1.1 Merge CountdownTimer into ChallengeHero

**Goal:** Remove a single-use component and simplify the tree.

**Steps:**
1. Copy the countdown markup from `CountdownTimer.svelte` into `ChallengeHero.svelte` where `<CountdownTimer />` is used.
2. Remove the `CountdownTimer` import.
3. Delete `CountdownTimer.svelte`.
4. Remove `CountdownTimer` from `_components/challenges/index.ts`.

**Files touched:** `ChallengeHero.svelte`, `CountdownTimer.svelte` (delete), `challenges/index.ts`

---

### 1.2 Fix LeaderboardUI Immutable Updates

**Goal:** Ensure reactivity when adding participants.

**Steps:**
1. In `LeaderboardUI.svelte.ts`, change `addChallengeParticipantWithRelations` from:
   ```ts
   this.challengeParticipantsWithRelations.push(challengeParticipantWithRelations);
   ```
   to:
   ```ts
   this.challengeParticipantsWithRelations = [...this.challengeParticipantsWithRelations, challengeParticipantWithRelations];
   ```
2. Ensure `challengeParticipantsWithRelations` is always reassigned, never mutated in place.

**Files touched:** `_logic/LeaderboardUI.svelte.ts`

---

### 1.3 Fix ChallengeUI Countdown Initialization

**Goal:** Make countdown setup clearer and avoid relying on derived state order.

**Steps:**
1. In `ChallengeUI.svelte.ts`, compute `targetDate` once from `startDate`/`endDate` (or via `getChallengeTimeStateFromDates`) before starting the interval.
2. Start the interval after derived state is set up, or use a stable reference for the stop condition.
3. Optionally move interval setup into an `$effect` that returns a cleanup function.

**Files touched:** `_logic/ChallengeUI.svelte.ts`

---

## Phase 2: Reduce Context Coupling

### 2.1 Pass Challenge as Prop to ChallengeHero

**Goal:** Make `ChallengeHero` less coupled to dashboard context.

**Steps:**
1. In `+page.svelte`, pass `challenge={dashboard.selectedChallenge}` into `ChallengeHero`.
2. In `ChallengeHero.svelte`, add `let { challenge } = $props()` and remove `getDashboardContext()`.
3. Keep the `{#if challenge}` guard; the parent already ensures `selectedChallenge` exists when rendering.

**Files touched:** `+page.svelte`, `ChallengeHero.svelte`

---

### 2.2 Pass Challenge as Prop to LeaderboardSection

**Goal:** Same as 2.1 for the leaderboard area.

**Steps:**
1. In `+page.svelte` (or wherever `LeaderboardSection` is rendered), pass `challenge={dashboard.selectedChallenge}`.
2. In `LeaderboardSection.svelte`, add `let { challenge } = $props()` and remove `getDashboardContext()`.
3. Pass `challenge` down to `LeaderboardTabs`, `LeaderboardTable`, and `ChallengeDetailsTab`.

**Files touched:** `+page.svelte`, `LeaderboardSection.svelte`, `LeaderboardTabs.svelte`, `LeaderboardTable.svelte`, `ChallengeDetailsTab.svelte`

---

### 2.3 Pass Props to LeaderboardRow

**Goal:** Make `LeaderboardRow` reusable and easier to test.

**Steps:**
1. In `LeaderboardTable.svelte`, pass `challenge`, `unit`, and `row` into each `LeaderboardRow`.
2. In `LeaderboardRow.svelte`, add `let { row, challenge, unit } = $props()` and remove `getDashboardContext()`.
3. `LeaderboardTable` gets `challenge` and `unit` from its parent (e.g. `LeaderboardSection`).

**Files touched:** `LeaderboardTable.svelte`, `LeaderboardRow.svelte`, `LeaderboardSection.svelte`

---

### 2.4 Pass Props to Child Components of ChallengeHero

**Goal:** Complete prop-based data flow for the hero section.

**Steps:**
1. `ChallengeStatsGrid`: add `let { stats } = $props()` (or `challenge` and derive `stats` internally). Parent passes `challenge?.leaderboard?.stats`.
2. `JoinChallengeButton`: add `let { challenge } = $props()`. Parent passes `challenge`.

**Files touched:** `ChallengeHero.svelte`, `ChallengeStatsGrid.svelte`, `JoinChallengeButton.svelte`

---

## Phase 3: Component Consolidation

### 3.1 Merge LeaderboardTabs into LeaderboardSection

**Goal:** Remove a thin wrapper component.

**Steps:**
1. In `LeaderboardSection.svelte`, inline the `Tabs` usage from `LeaderboardTabs.svelte`.
2. Import `Tabs` from `$lib/components/Tabs.svelte` and `LEADERBOARD_TAB`, `LEADERBOARD_TAB_LABEL` from constants.
3. Add tab selection logic (call `challenge?.setActiveTab(value)`).
4. Delete `LeaderboardTabs.svelte`.
5. Remove `LeaderboardTabs` from `leaderboard/index.ts`.

**Files touched:** `LeaderboardSection.svelte`, `LeaderboardTabs.svelte` (delete), `leaderboard/index.ts`

---

## Phase 4: Component Splits (Optional)

### 4.1 Split ChallengeHero into Smaller Components

**Goal:** Simplify `ChallengeHero` and improve testability.

**Steps:**
1. Create `ChallengeHeroActions.svelte`:
   - Countdown display
   - Join/Leave button (or `JoinChallengeButton`)
   - Accepts `challenge` as prop.
2. In `ChallengeHero.svelte`, keep:
   - Badges and dates
   - Title
   - Render `ChallengeHeroActions` and `ChallengeStatsGrid`.
3. Optionally extract `ChallengeHeroBadges` for the top badge row.

**Files touched:** `ChallengeHero.svelte`, new `ChallengeHeroActions.svelte` (and optionally `ChallengeHeroBadges.svelte`)

---

### 4.2 Split LeaderboardRow into Snippets or Subcomponents

**Goal:** Make the row easier to read and maintain.

**Option A – Snippets in same file:**
1. Add `{#snippet athleteBlock(row)}`, `{#snippet statsBlock(row)}`, `{#snippet activityBlock(row)}` in `LeaderboardRow.svelte`.
2. Replace inline markup with `{@render athleteBlock(row)}`, etc.

**Option B – Subcomponents:**
1. Create `LeaderboardRowAthlete.svelte` (avatar, name, Strava link).
2. Create `LeaderboardRowStats.svelte` (distance, pace, time/status).
3. Create `LeaderboardRowActivity.svelte` (activity name, Strava link).
4. `LeaderboardRow.svelte` composes these with `row`, `challenge`, `unit` props.

**Files touched:** `LeaderboardRow.svelte`, optionally new `LeaderboardRowAthlete.svelte`, `LeaderboardRowStats.svelte`, `LeaderboardRowActivity.svelte`

---

### 4.3 Refactor JoinChallengeButton with Snippets

**Goal:** Clarify the different states without adding more components.

**Steps:**
1. Add `{#snippet joinForm()}`, `{#snippet participatingBadge()}`, `{#snippet endedBadge()}`, `{#snippet notActiveBadge()}`.
2. Replace the long `{#if} {:else if}` chain with `{@render snippetForState()}` or similar.
3. Keep a single component; no new files.

**Files touched:** `JoinChallengeButton.svelte`

---

## Phase 5: Logic Extraction (Optional)

### 5.1 Move Join/Leave Logic into ChallengeUI

**Goal:** Keep components focused on UI; logic in `ChallengeUI`.

**Steps:**
1. In `ChallengeUI.svelte.ts`, add:
   - `async submitJoin()` – sets `isSubmitting`, calls form action (or API), then `join()` or resets on error.
   - `async submitLeave()` – same pattern for leave.
2. Components call these methods instead of using `use:enhance` with inline logic.
3. Form actions stay in `+page.server.ts`; components trigger them via `fetch` or form submit, with `ChallengeUI` handling optimistic updates and errors.

**Note:** This may require changing how form actions are invoked (e.g. `fetch` + `applyAction` instead of native form submit). Evaluate trade-offs before implementing.

**Files touched:** `ChallengeUI.svelte.ts`, `ChallengeHero.svelte`, `JoinChallengeButton.svelte`, possibly `+page.server.ts`

---

## Execution Order

| Order | Phase | Rationale |
|-------|-------|-----------|
| 1 | Phase 1 (1.1–1.3) | Small, low-risk fixes first |
| 2 | Phase 2 (2.1–2.4) | Prop-based data flow before structural changes |
| 3 | Phase 3 (3.1) | Merge tabs after props are in place |
| 4 | Phase 4 (4.1–4.3) | Optional splits; do if complexity justifies it |
| 5 | Phase 5 (5.1) | Optional logic extraction; evaluate effort vs benefit |

---

## Rollback Strategy

- **Phase 1:** Revert the touched files.
- **Phase 2:** Revert and reintroduce `getDashboardContext()` where needed.
- **Phase 3:** Restore `LeaderboardTabs.svelte` from git.
- **Phase 4:** Revert new components and restore original `ChallengeHero` / `LeaderboardRow` / `JoinChallengeButton`.
- **Phase 5:** Revert logic changes and restore original form handling.

---

## Testing Checklist (Post-Refactor)

- [ ] Challenges tab: select challenge, switch challenges.
- [ ] Join challenge: button, loading state, success, error.
- [ ] Leave challenge: button, loading state, success, error.
- [ ] Countdown updates every second.
- [ ] Stats grid shows correct numbers.
- [ ] Leaderboard tab: rows, sorting, empty state.
- [ ] Details tab: challenge info renders correctly.
- [ ] Sidebar: expand/collapse, select challenge.
- [ ] Drawer (mobile): open, select challenge, close.
- [ ] Club Leaderboard tab: empty state.
