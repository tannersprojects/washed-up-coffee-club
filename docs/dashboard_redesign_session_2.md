# Dashboard Redesign — Session 2: Challenges Sidebar (Master–Detail)

**Goal:** When the Challenges tab is active, show a left sidebar (navigation rail) listing challenges and a right-hand stage (hero, stats, challenge leaderboard). When there is only one challenge, hide the sidebar and center the stage. State remains in context; no URL changes required this session.

**Definition of done:** On the Challenges tab, a sidebar lists all challenges; selecting one updates the stage. Single-challenge case hides the sidebar and centers the stage. Desktop layout is correct.

---

## 1. Overview

- **Challenges tab only:** The sidebar exists only when `dashboard.activeTab === 'challenges'`. The Club Leaderboard tab is unchanged (no sidebar).
- **Two-column layout (desktop):**
  - **Sidebar (left):** Fixed width (e.g. `w-80` or `w-96` per spec). Border-right (e.g. `border-r border-(--grey-olive)` or `border-white/10`). Scrollable list of challenges. Each item: status indicator (dot), title, meta (date or "Ends in X"), optional user rank. Selected item: `bg-white/10` or `bg-(--vintage-grape)` with low opacity + left border `border-l-2 border-(--accent-lime)`.
  - **Stage (right):** `flex-1 min-h-0 overflow-auto`. Contains the existing ChallengeHero, stats, and LeaderboardSection (Challenge Leaderboard).
- **Single-challenge edge case:** When `dashboard.challenges.length === 1` and activeTab is challenges, hide the sidebar; render only the stage, centered (e.g. `max-w-4xl mx-auto`).
- **Empty state:** When there are zero challenges, keep current empty state (no sidebar, no stage).

---

## 2. Code Locations & Updates

### 2.1 Dashboard page structure

**File:** `src/routes/(app)/dashboard/+page.svelte`

- **Current structure (Challenges tab):** When `activeTab === 'challenges'`, the page currently renders either EmptyState or (optionally ChallengesList) + ChallengeHero + LeaderboardSection + DashboardFooter.
- **New structure (Challenges tab, multiple challenges):**
  - Wrap content in a flex row container: `flex flex-1 min-h-0 w-full overflow-hidden`.
  - **Sidebar:** New component (e.g. `DashboardChallengesSidebar.svelte`) — see below. Pass `dashboard` via context (it already is) or as prop; sidebar reads `dashboard.challenges`, `dashboard.selectedChallengeId`, and calls `dashboard.selectChallenge(id)`.
  - **Stage:** A div with `flex-1 min-h-0 overflow-auto` containing: ChallengeHero, stats (already inside ChallengeHero or separate — keep as is), LeaderboardSection. No ChallengesList in the main area; the sidebar replaces it.
- **New structure (Challenges tab, single challenge):**
  - No sidebar. One column: stage only, with `max-w-4xl mx-auto w-full px-6` (or similar) so content is centered. Same content: ChallengeHero, LeaderboardSection.
- **New structure (Challenges tab, zero challenges):**
  - Keep EmptyState only (no sidebar, no stage).
- **Club Leaderboard tab:** Unchanged; still placeholder.

**Logic summary:**

```text
if activeTab === 'club-leaderboard' → Club Leaderboard placeholder + footer
else (challenges tab):
  if challenges.length === 0 → EmptyState + footer
  else if challenges.length === 1 → centered stage (Hero + LeaderboardSection) + footer
  else → sidebar + stage + footer
```

- **ChallengesList:** No longer rendered on the dashboard page when there are multiple challenges; the sidebar replaces it. You can keep `ChallengesList.svelte` in the codebase for now (e.g. unused) or remove it in this session; removing it avoids dead code.

---

### 2.2 New component: Challenges sidebar

**File:** `src/routes/(app)/dashboard/_components/DashboardChallengesSidebar.svelte` (create new)

- **Purpose:** Renders the left rail of challenge items when there are multiple challenges.
- **Data:** Use `getDashboardContext()` to get `dashboard`. Derive `challenges = dashboard.challenges`, `selectedChallengeId = dashboard.selectedChallengeId`. On item click, call `dashboard.selectChallenge(challenge.id)`.
- **Layout:**
  - Container: fixed width (e.g. `w-80` or `w-96`), `flex flex-col h-full border-r border-white/10` (or `border-(--grey-olive)`), `shrink-0`.
  - Optional header: e.g. "Challenges" label or nothing; spec said "Context Switcher" is the tab bar, so sidebar can just be the list.
  - List: `flex-1 min-h-0 overflow-y-auto` with a list of buttons or divs, one per challenge.
- **Item anatomy (per spec):**
  - Status dot: small circle — Lime = active, Yellow = upcoming, Grey = past. Challenge status is on `challenge.status` (from ChallengeUI / server data).
  - Title: challenge title (truncate with `truncate` or `line-clamp-1`).
  - Meta: date range or "Ends in X hrs" (ChallengeUI may expose `timeLeft` or end date; reuse or add a short label).
  - Right-aligned: user's rank if participating (e.g. "#4"). You can derive rank from `challenge.leaderboard` (LeaderboardUI) by finding the current user's participant and their rank.
- **Selected state:** When `challenge.id === selectedChallengeId`, apply `bg-white/10` (or `bg-(--vintage-grape)` with opacity) and `border-l-2 border-(--accent-lime)`.
- **Hover state:** `hover:bg-white/5`.
- **Styling:** Use `layout.css` tokens: `--accent-lime`, `--grey-olive`, `--vintage-grape`, `--white`. Uppercase/labels can use `text-[10px] tracking-widest text-(--grey-olive)`.

---

### 2.3 ChallengeUI / LeaderboardUI: rank for current user

**File:** `src/routes/(app)/dashboard/_logic/ChallengeUI.svelte.ts` or `LeaderboardUI.svelte.ts`

- The sidebar wants to show "user's rank" (e.g. "#4") for the current user in that challenge. Check if `LeaderboardUI` or `ChallengeUI` already exposes a "current user rank" (e.g. from `leaderboardRows` by finding the row for the current user). If not, add a derived getter (e.g. `currentUserRank: number | null`) that computes rank from `leaderboardRows` and the current user's profile id (you need profile id in context or from layout data). Profile is available from `data.profile` in the app layout; dashboard context does not currently hold profile. Options: (a) pass profile into dashboard context from layout data, or (b) pass profile into the sidebar as a prop from the page (page has access to `data` from parent). Prefer (b) for minimal change: page gets `data` from layout and passes `profile={data.profile}` to `DashboardChallengesSidebar`, and the sidebar computes rank from challenge.leaderboard + profile.id. Alternatively, add `profile` to `DashboardContextData` and set it in the dashboard layout so context has it; then sidebar can use it without prop. Either is fine; document the choice in the component.
- If you don’t want to implement rank in the sidebar in this session, you can show a generic "Joined" or nothing on the right; add rank in a follow-up.

---

### 2.4 Dashboard shell (from Session 1)

**File:** `src/routes/(app)/dashboard/+page.svelte`

- Session 1 implemented the full-height dashboard shell (tab bar + content area) directly in the page, not in a route-specific layout. The outer wrapper already uses `flex min-h-0 flex-1 w-full flex-col` and the content area uses `flex min-h-0 flex-1 flex-col overflow-auto`, which are sufficient for this session. No additional structural changes are required here for the sidebar work.

---

### 2.5 Remove or keep ChallengesList

**File:** `src/routes/(app)/dashboard/+page.svelte`

- Stop importing and rendering `ChallengesList` when there are multiple challenges; the sidebar replaces it.
- **File:** `src/routes/(app)/dashboard/_components/ChallengesList.svelte` — Can be left in repo for reference or deleted. If deleted, remove any other imports of it.

---

## 3. File Summary

| Action   | File |
|----------|------|
| Create   | `src/routes/(app)/dashboard/_components/DashboardChallengesSidebar.svelte` — sidebar list, selection, styling. |
| Edit     | `src/routes/(app)/dashboard/+page.svelte` — conditional layout: sidebar + stage when multiple challenges; centered stage when one; empty state when zero. Remove ChallengesList. |
| Edit     | `src/routes/(app)/dashboard/_logic/ChallengeUI.svelte.ts` or `LeaderboardUI.svelte.ts` — optional: expose current user rank for sidebar. |
| Delete   | `src/routes/(app)/dashboard/_components/ChallengesList.svelte` — optional; remove if unused. |

---

## 4. Testing Checklist

- [ ] Challenges tab with **multiple** challenges: Sidebar visible on the left; stage on the right. Clicking a challenge in the sidebar updates the stage (hero + leaderboard).
- [ ] Challenges tab with **one** challenge: No sidebar; stage is centered (max-width container) with hero + leaderboard.
- [ ] Challenges tab with **zero** challenges: Empty state only; no sidebar.
- [ ] Club Leaderboard tab: Unchanged; no sidebar.
- [ ] Selected challenge in sidebar has visible active state (left border + background).
- [ ] Stage scrolls independently when content is long; sidebar stays fixed.
- [ ] Countdown and "Join" / "Leave" still work for the selected challenge.

---

## 5. References

- Spec: Master–detail, sidebar item anatomy, single-challenge edge case (design doc).
- Design tokens: `src/routes/layout.css`.
- Context: `getDashboardContext()`, `DashboardUI.selectChallenge`, `ChallengeUI.status`, `ChallengeUI.leaderboard`.
