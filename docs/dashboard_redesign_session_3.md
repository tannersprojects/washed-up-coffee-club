# Dashboard Redesign — Session 3: Responsive + Polish

**Goal:** Make the dashboard work correctly on mobile: hide the challenges sidebar and provide a drawer/sheet to switch challenges. Polish desktop behavior (sticky headers, scroll, animations) as needed.

**Definition of done:** On viewports below the breakpoint (e.g. 768px), the sidebar is hidden and a control (e.g. "Menu" or "Events" or hamburger) opens a drawer with the challenge list. Selecting a challenge in the drawer updates the stage and closes the drawer. Desktop behavior unchanged. No regressions.

---

## 1. Overview

- **Breakpoint:** Use `768px` (Tailwind `md`) as the cutoff: below = mobile, above = desktop.
- **Desktop (≥768px):** Keep Session 2 behavior: sidebar visible when multiple challenges; stage on the right; single-challenge centered without sidebar.
- **Mobile (<768px):**
  - Sidebar is **hidden**. The main area shows only the **stage** (hero, stats, challenge leaderboard). No sidebar column.
  - A **trigger** (button or link) opens a **drawer/sheet** that contains the same list as the sidebar (challenge list). Placement: top bar of the dashboard (e.g. in the tab row or just above the stage). Label: "Challenges", "Events", or hamburger icon — per design.
  - When the user selects a challenge in the drawer, update selection (existing `dashboard.selectChallenge(id)`) and **close the drawer**.
  - Drawer overlay: tapping outside or an explicit close should close the drawer.
- **Polish (optional in this session):** Sticky leaderboard header, scroll behavior, reveal animations. Only if time permits and spec calls for it.

---

## 2. Code Locations & Updates

### 2.1 Dashboard page: trigger for mobile drawer

**File:** `src/routes/(app)/dashboard/+page.svelte`

- The tab bar (Challenges | Club Leaderboard) already lives in the page. When `activeTab === 'challenges'` and viewport is mobile, add a control that opens the challenges drawer. Options:
  - **Option A:** Drawer state lives in the page. The page has a "Challenges" or hamburger button that sets `drawerOpen = true`. The page renders the drawer (overlay + panel) and passes `open`, `onClose`, and optionally `onSelectChallenge` (or the drawer reads context and calls `dashboard.selectChallenge` then closes). The **drawer content** can be the same list as `DashboardChallengesSidebar` — consider extracting the list into a shared component (e.g. `ChallengeListItems.svelte`) used by both the sidebar and the drawer.
  - **Option B:** Drawer state lives in `DashboardUI` (see 2.2). The page button calls `dashboard.openChallengesDrawer()`, and the drawer reads `dashboard.drawerOpen` from context.
- **Recommendation:** Keep the **trigger button** in the dashboard page next to the tabs (e.g. "Challenges" tab + on mobile a "▼" or menu icon that opens the list). Show the trigger only when `activeTab === 'challenges'` and only on mobile (Tailwind `md:hidden`). Drawer content should reuse the same list markup as the sidebar (extract to a reusable component or slot).

---

### 2.2 Drawer state in context or page

- **Option A — State in page:** Add `drawerOpen = $state(false)` to the dashboard page. Open: trigger button sets `drawerOpen = true`. Close: overlay click or after `selectChallenge` (page passes `onClose={() => (drawerOpen = false)}` to the drawer; the drawer calls `dashboard.selectChallenge(id)` then `onClose()`). This keeps the state local to the page component.
- **Option B — State in DashboardUI (recommended):** Add `drawerOpen = $state(false)` and `openChallengesDrawer()` / `closeChallengesDrawer()` to `DashboardUI`. Then both the trigger button and the drawer (close after select) read and mutate a single source of truth in context.
- **Recommendation:** Option B — add `drawerOpen` and open/close methods to `DashboardUI` so the entire dashboard state stays in context and the page doesn’t hold duplicate state.

**File:** `src/routes/(app)/dashboard/_logic/DashboardUI.svelte.ts`

- Add `drawerOpen = $state(false)`.
- Add `openChallengesDrawer()` that sets `this.drawerOpen = true`.
- Add `closeChallengesDrawer()` that sets `this.drawerOpen = false`.
- In the sidebar component (or a new drawer component), when an item is clicked on mobile, call `dashboard.selectChallenge(id)` then `dashboard.closeChallengesDrawer()`.

---

### 2.3 Responsive layout in the page

**File:** `src/routes/(app)/dashboard/+page.svelte`

- **Desktop (md and up):** Keep current structure: when multiple challenges, render sidebar + stage in a flex row. Use Tailwind `hidden md:flex` (or similar) on the sidebar wrapper so the sidebar is **hidden on small screens** and **visible from md up**.
- **Mobile:** The stage is always full width. The sidebar div should be `hidden md:block` (or `hidden md:flex`) so on mobile it doesn’t take space. The **drawer** (rendered by the page) shows the list on mobile; it can use the same list component as the sidebar content.

---

### 2.4 Drawer component

**File:** `src/routes/(app)/dashboard/_components/ChallengesDrawer.svelte` (create new)

- **Purpose:** Full-screen or partial overlay that shows the challenge list on mobile. Used only when `drawerOpen` is true.
- **Structure:**
  - Overlay: fixed inset, `bg-black/60` or similar, `z-40` (or higher than nav). Click to close: `onclick={() => getDashboardContext().closeChallengesDrawer()}`.
  - Panel: slides in from left (or bottom). Contains the same list as `DashboardChallengesSidebar` — ideally reuse a shared inner component (e.g. `ChallengeListItems.svelte`) that takes `onSelectChallenge` callback. On item click: call `dashboard.selectChallenge(id)`, then `dashboard.closeChallengesDrawer()`.
  - Optional: Close button (X) in the panel header.
- **Visibility:** Rendered only when `dashboard.drawerOpen === true`. Use `getDashboardContext()`.
- **Responsive:** Show only on mobile, or always render when open (on desktop the sidebar is visible so the drawer is rarely opened; you can still allow opening it on desktop for consistency, or hide the trigger on desktop so drawer never opens). Prefer: drawer is used only on mobile; on desktop the trigger is hidden (`md:hidden`) so the drawer never opens on large screens.

---

### 2.5 Extract shared challenge list content (optional but recommended)

**File:** `src/routes/(app)/dashboard/_components/ChallengeListItems.svelte` (create new)

- **Purpose:** The list of challenge items (status dot, title, meta, rank) with selection and click behavior. Used by both `DashboardChallengesSidebar` and `ChallengesDrawer`.
- **Props:** `challenges` (ChallengeUI[]), `selectedChallengeId: string | null`, `onSelect(id: string)`, optional `profile` for rank. Or get everything from context: `getDashboardContext()` and derive challenges + selectedChallengeId, call `dashboard.selectChallenge(id)` on click.
- **Benefit:** One place for item styling and behavior; sidebar and drawer both render `<ChallengeListItems />` in different containers.

If you prefer not to extract, duplicate the list markup in sidebar and drawer (simpler but duplicated).

---

### 2.6 Page: trigger button and drawer

**File:** `src/routes/(app)/dashboard/+page.svelte`

- When `activeTab === 'challenges'`, show a trigger button on mobile: e.g. "Challenges" with chevron or hamburger. Use Tailwind `md:hidden` so it only shows below 768px. On click: either set local `drawerOpen = true` (Option A) or call `getDashboardContext().openChallengesDrawer()` (Option B).
- Render `<ChallengesDrawer />` when the drawer is open (either `drawerOpen` from page state or `dashboard.drawerOpen` from context). The drawer component should be rendered above the main content area (using `fixed` positioning) and read from context to call `selectChallenge` and close. Ensure z-index is above the main content (e.g. `z-50`).

---

### 2.7 Sidebar: hide on mobile

**File:** `src/routes/(app)/dashboard/_components/DashboardChallengesSidebar.svelte`

- Add `hidden md:flex` (or `hidden md:block`) to the sidebar root so it is not visible on small screens. The drawer provides the list on mobile.

---

## 3. File Summary

| Action   | File |
|----------|------|
| Edit     | `src/routes/(app)/dashboard/_logic/DashboardUI.svelte.ts` — add `drawerOpen`, `openChallengesDrawer()`, `closeChallengesDrawer()`. |
| Create   | `src/routes/(app)/dashboard/_components/ChallengesDrawer.svelte` — overlay + panel, list, close on select or overlay click. |
| Create   | `src/routes/(app)/dashboard/_components/ChallengeListItems.svelte` — optional; shared list used by sidebar and drawer. |
| Edit     | `src/routes/(app)/dashboard/+page.svelte` — mobile trigger button, render `ChallengesDrawer`, and ensure the sidebar wrapper uses `hidden md:flex` so the sidebar is hidden on mobile. |
| Edit     | `src/routes/(app)/dashboard/_components/DashboardChallengesSidebar.svelte` — ensure `hidden md:flex` (or equivalent) so sidebar only on desktop. |

---

## 4. Testing Checklist

- [ ] **Desktop:** Same as Session 2. Sidebar visible with multiple challenges; no drawer trigger visible (or drawer trigger hidden).
- [ ] **Mobile, Challenges tab:** No sidebar. Trigger (e.g. "Challenges" or hamburger) visible. Tapping trigger opens drawer with challenge list.
- [ ] **Mobile, drawer:** Tapping a challenge selects it, updates the stage, and closes the drawer. Tapping overlay closes the drawer without changing selection.
- [ ] **Mobile, Club Leaderboard tab:** No drawer trigger; placeholder view as before.
- [ ] **Single challenge (mobile):** No sidebar, no drawer needed (only one challenge). Stage shows that challenge; no broken layout.
- [ ] **Zero challenges (mobile):** Empty state; no drawer trigger or drawer.
- [ ] No double scrollbars; stage scrolls correctly on mobile.

---

## 5. Polish (Optional)

- **Sticky leaderboard header:** In `LeaderboardTable.svelte` or `LeaderboardSection.svelte`, make the table header `sticky top-0` with `backdrop-blur` and `bg-black/80` so it stays visible when scrolling (per spec).
- **Reveal animation:** Existing `.reveal` in `layout.css`; ensure hero and leaderboard use it where appropriate.
- **Transitions:** Drawer panel slide-in (e.g. `transition-transform` from left or bottom); overlay fade-in.

---

## 6. References

- Spec: Mobile sidebar hidden, drawer/sheet for challenge list.
- Design tokens: `src/routes/layout.css`.
- Context: `DashboardUI.drawerOpen`, `openChallengesDrawer`, `closeChallengesDrawer`, `selectChallenge`.
