# Dashboard: Zod Validation at Load Boundary

## Overview

Add runtime validation (Zod schemas) for the dashboard load payload at the boundary. Validates data shape and types before hydration; fails fast if the server returns unexpected data.

## Current State

- Dashboard load data is trusted; no runtime validation
- Types are inferred from Drizzle schema and ad-hoc extensions
- Malformed or unexpected data could cause runtime errors in components

## Requirements

- Define Zod schemas for `DashboardContextData` (or the load payload shape)
- Validate in `load` or at hydration (e.g. in `setDashboardContext` or before `DashboardUI.fromServerData`)
- On validation failure: log error, return safe fallback or redirect to error page
- Ensures date fields, nested structures, and participant arrays match expected shape

## Implementation Notes

- **Dependencies:** Add `zod` if not already present
- **Files to create:** `src/lib/schemas/dashboard.ts` (or similar)
- **Files to update:** `src/routes/(app)/dashboard/+page.server.ts`, `+page.svelte`, or context
- **Priority:** Optional — defensive; useful for production robustness and debugging

## Related Docs

- [dashboard-improvements-plan.md](../dashboard-improvements-plan.md) — Section 2.4 Option C, Phase 3
