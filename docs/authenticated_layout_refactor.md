# Authenticated Layout & Shared Nav Refactor (Post–Admin MVP)

**Status:** Defer until after admin dashboard functionality is complete.

This document captures the plan to:

- Extract a **shared authenticated layout** for the app (dashboard + admin).
- Consolidate the very similar nav bars into that layout.
- Centralize authentication checks for these routes.

The goal is to remove duplication between:

- `src/routes/dashboard/_components/DashboardNav.svelte`
- `src/routes/admin/_components/AdminNav.svelte`

and to create a clean separation between **public** pages and **authenticated app** pages.

---

## High-Level Idea

Introduce an authenticated route group and a shared layout:

```text
src/routes/(app)/+layout.server.ts   # auth checks, shared data (profile, isAdmin, etc.)
src/routes/(app)/+layout.svelte      # shared nav (avatar, dropdown, logout, links)
src/routes/(app)/dashboard/+page.*   # existing dashboard
src/routes/(app)/admin/+page.*       # existing admin dashboard
```

### Responsibilities

- **`(app)/+layout.server.ts`**
  - Runs **once** for all authenticated app routes (`/dashboard`, `/admin`, future pages).
  - Uses `locals.safeGetSession()` (from `src/hooks.server.ts`) to:
    - Ensure there is a valid session and profile.
    - Redirect unauthenticated users back to `/` (or auth flow).
  - Returns a minimal data object, likely:
    - `profile`
    - (Optionally) `isAdmin: profile.role === PROFILE_ROLE.ADMIN`

- **`(app)/+layout.svelte`**
  - Renders a **single nav component** that replaces `DashboardNav` and `AdminNav`.
  - Receives `data.profile` (and optionally `data.isAdmin`) and uses it to:
    - Show the avatar, name, and dropdown.
    - Provide links:
      - `/dashboard`
      - `/admin` (only if `isAdmin`)
      - `POST /auth/logout`
    - Show the current section label (`Dashboard` vs `Admin`) based on the route.
  - Uses a `<slot>` / `{@render children()}` for the page content.

- **`dashboard/+page.server.ts`**
  - Can assume the user is authenticated and has a profile.
  - Only responsible for **dashboard data loading**, not auth/redirects.

- **`admin/+page.server.ts`**
  - Still enforces **admin-only** access:
    - Checks `profile.role === PROFILE_ROLE.ADMIN`, redirects if not.
  - Loads admin-specific data (memories, schedules, challenges, etc.).

---

## Nav Consolidation Plan

### Current State

- `DashboardNav.svelte`:
  - Brand: \"Washed Up Coffee Club / Dashboard\"
  - Right side: \"Live Feed\" indicator, avatar dropdown, logout.
  - If `profile.role === ADMIN`, shows link to `/admin` in dropdown.

- `AdminNav.svelte`:
  - Brand: \"Washed Up Coffee Club / Admin\"
  - Right side: avatar dropdown with:
    - User name.
    - Link to `/dashboard` with icon.
    - Logout with icon.

They share:

- Overall layout and styling (fixed top bar, blur, colors).
- Avatar button behavior (click, focus, click-outside).
- Logout form.

### Target State (Shared Nav in Layout)

Create a **single nav** in `(app)/+layout.svelte`, something like:

- Left:
  - Brand `Washed Up Coffee Club`.
  - Section label derived from route (e.g. \"Dashboard\" vs \"Admin\").
- Right:
  - Optional \"Live Feed\" indicator (only on dashboard route, if desired).
  - Avatar dropdown:
    - User name.
    - **Links:**
      - `Dashboard` → `/dashboard`
      - `Admin dashboard` → `/admin` (if `isAdmin`)
    - `Log out` action.

This nav receives `profile` (and `isAdmin`) from the layout `data` and does not depend on per-page components.

---

## Auth Route Grouping

### Goal

Keep all **authenticated app** routes under one group (e.g. `(app)`), so:

- Auth checks are centralized.
- The shared nav only appears on authenticated pages.

### Changes Needed

1. **Move dashboard and admin routes under `(app)` group**

```text
src/routes/(app)/dashboard/+page.server.ts
src/routes/(app)/dashboard/+page.svelte
src/routes/(app)/dashboard/_components/*    # existing components
src/routes/(app)/dashboard/_logic/*        # existing logic

src/routes/(app)/admin/+page.server.ts
src/routes/(app)/admin/+page.svelte
src/routes/(app)/admin/_components/*
src/routes/(app)/admin/_logic/*
```

2. **Create `src/routes/(app)/+layout.server.ts`**

Responsibilities:

- Call `locals.safeGetSession()`:

  ```ts
  const { session, user } = await locals.safeGetSession();
  const profile = locals.profile;

  if (!session || !user || !profile) {
    throw redirect(302, '/');
  }

  return {
    profile,
    isAdmin: profile.role === PROFILE_ROLE.ADMIN
  };
  ```

- This ensures:
  - Any route under `(app)` has `profile` and `isAdmin` in `data`.
  - Unauthenticated users never reach `/dashboard` or `/admin`.

3. **Create `src/routes/(app)/+layout.svelte`**

Responsibilities:

- Import the shared nav component (or inline the nav markup).
- Use `data.profile` and `data.isAdmin` to render:
  - Brand + section label.
  - Avatar dropdown with:
    - Name.
    - `Dashboard` link.
    - `Admin dashboard` link (if `isAdmin`).
    - `Log out`.
- Render page content via Svelte 5 runes (e.g. `let { data, children } = $props(); {@render children()}`).

4. **Keep admin-only guard in `admin/+page.server.ts`**

- Even though `(app)` enforces \"logged in\", `admin` should still do:

  ```ts
  if (profile.role !== PROFILE_ROLE.ADMIN) {
    throw redirect(302, '/dashboard'); // or '/'
  }
  ```

---

## Summary of Work (for later)

1. **Introduce `(app)` route group** and move `dashboard` and `admin` under it.\n
2. **Add `(app)/+layout.server.ts`** to enforce \"must be authenticated\" and to expose `profile` / `isAdmin` to children.\n
3. **Add `(app)/+layout.svelte`** with a shared nav using `profile`/`isAdmin`.\n
4. **Delete or simplify** `DashboardNav.svelte` and `AdminNav.svelte` by inlining their logic into the shared layout, or keep a single shared nav component and use it from the layout.\n
5. **Keep admin-only checks** in `admin/+page.server.ts` for role-based authorization.\n
\n
This refactor reduces duplication, clarifies the boundary between public and authenticated areas, and makes it easier to add new authenticated pages in the future.\n
\n*** End Patch***"}"/>
