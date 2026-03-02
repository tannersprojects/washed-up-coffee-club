# Dashboard DTO Implementation Plan

This document describes the full implementation of the DTO (Data Transfer Object) pattern for the dashboard route, including code changes, file structure updates, and new types.

---

## 1. Current Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ SERVER                                                                            │
│  loadDashboardData() → raw Drizzle (Challenge, ChallengeParticipant, etc.)       │
│  +page.server.ts load → returns { profile, challengesWithParticipation, ... }    │
│  Actions return raw DB types (challengeParticipantWithRelations)                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                              SvelteKit serializes (Date → string)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CLIENT                                                                            │
│  data = PageData (dates are strings, schema types still in type defs)            │
│  setDashboardContext(data) → DashboardUI.fromServerData(data)                    │
│  ChallengeUI constructor receives data, assigns startDate/endDate (may be string)│
│  JoinChallengeButton: challenge.join(result.data.challengeParticipantWithRelations)│
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Current issues:**
- Types extend schema (`Challenge & { ... }`) but data is serialized
- No explicit mapping step; loader returns raw DB shapes
- Dates typed as `Date` but arrive as strings
- Action results used directly without hydration

---

## 2. Target File Structure

```
src/routes/(app)/dashboard/
├── +page.server.ts           # Map loader/action output to DTOs
├── +page.svelte
├── loader.server.ts          # Unchanged (returns DB types internally)
├── _types/
│   ├── dto.ts                # DTO types (wire format)
│   └── hydrated.ts            # Hydrated types (in-memory, Date parsed)
├── _server/
│   └── mappers.server.ts     # DB → DTO
├── _logic/
│   ├── hydrators.ts          # DTO → hydrated (client)
│   ├── context.ts
│   ├── DashboardUI.svelte.ts
│   ├── ChallengeUI.svelte.ts
│   └── LeaderboardUI.svelte.ts
└── _components/
    └── ...
```

**New files:**
- `_types/dto.ts` — DTO type definitions
- `_types/hydrated.ts` — Hydrated type definitions
- `_server/mappers.server.ts` — Server-side mappers
- `_logic/hydrators.ts` — Client-side hydrators

---

## 3. New DTO Types

**File:** `src/routes/(app)/dashboard/_types/dto.ts`

```ts
/**
 * Dashboard DTOs — serializable shapes for server → client transfer.
 * All date fields are ISO strings.
 */

export type ProfileDTO = {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  stravaAthleteId: number | null;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export type ChallengeContributionDTO = {
  id: string;
  participantId: string;
  stravaActivityId: number;
  activityName: string | null;
  distance: number | null;
  time: number | null;
  isValid: boolean | null;
  occurredAt: string;
  createdAt: string;
};

export type ChallengeParticipantDTO = {
  id: string;
  challengeId: string;
  profileId: string;
  status: string | null;
  joinedAt: string | null;
  resultDistance: number | null;
  resultTime: number | null;
  highlightActivityId: number | null;
  createdAt: string;
  updatedAt: string;
  profile: ProfileDTO;
  contributions: ChallengeContributionDTO[];
};

export type ChallengeDTO = {
  id: string;
  title: string;
  description: string;
  type: string;
  goalDistance: number | null;
  segmentId: number | null;
  startDate: string;
  endDate: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChallengeWithParticipationDTO = ChallengeDTO & {
  isParticipating: boolean;
  participant: ChallengeParticipantDTO | null;
};

export type DashboardPageDataDTO = {
  profile: ProfileDTO | null;
  challengesWithParticipation: ChallengeWithParticipationDTO[];
  challengeParticipantsWithRelationsByChallenge: Record<string, ChallengeParticipantDTO[]>;
};

/** Action result for joinChallenge */
export type JoinChallengeActionResultDTO = {
  success: true;
  challengeParticipantWithRelations: ChallengeParticipantDTO;
};

/** Action result for leaveChallenge */
export type LeaveChallengeActionResultDTO = {
  success: true;
  challengeId: string;
};
```

---

## 4. Hydrated Types

**File:** `src/routes/(app)/dashboard/_types/hydrated.ts`

```ts
/**
 * Hydrated types — in-memory shapes after parsing DTOs (string → Date).
 * Used only in dashboard _logic and components.
 */
import type { ProfileDTO, ChallengeContributionDTO, ChallengeParticipantDTO } from './dto.js';

export type ProfileHydrated = Omit<ProfileDTO, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

export type ChallengeContributionHydrated = Omit<
  ChallengeContributionDTO,
  'occurredAt' | 'createdAt'
> & {
  occurredAt: Date;
  createdAt: Date;
};

export type ChallengeParticipantWithRelationsHydrated = Omit<
  ChallengeParticipantDTO,
  'joinedAt' | 'createdAt' | 'updatedAt' | 'profile' | 'contributions'
> & {
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile: ProfileHydrated;
  contributions: ChallengeContributionHydrated[];
};

export type ChallengeWithParticipationHydrated = Omit<
  import('./dto.js').ChallengeWithParticipationDTO,
  'startDate' | 'endDate' | 'createdAt' | 'updatedAt' | 'participant'
> & {
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  participant: ChallengeParticipantWithRelationsHydrated | null;
};

export type DashboardContextDataHydrated = {
  profile: ProfileHydrated | null;
  challengesWithParticipation: ChallengeWithParticipationHydrated[];
  challengeParticipantsWithRelationsByChallenge: Record<
    string,
    ChallengeParticipantWithRelationsHydrated[]
  >;
};

/** Leaderboard row structure (derived, not transferred) */
export type LeaderboardRowData = {
  participant: ChallengeParticipantWithRelationsHydrated;
  profile: ProfileHydrated;
  contribution: ChallengeContributionHydrated | null;
  rank: number | null;
};
```

---

## 5. Mapper Functions (Server)

**File:** `src/routes/(app)/dashboard/_server/mappers.server.ts`

```ts
import type {
  Profile,
  Challenge,
  ChallengeParticipant,
  ChallengeContribution
} from '$lib/db/schema';
import type {
  ProfileDTO,
  ChallengeDTO,
  ChallengeContributionDTO,
  ChallengeParticipantDTO,
  ChallengeWithParticipationDTO
} from '../_types/dto.js';

function toIso(d: Date | string): string {
  return typeof d === 'string' ? d : d.toISOString();
}

export function toProfileDTO(p: Profile): ProfileDTO {
  return {
    id: p.id,
    firstname: p.firstname,
    lastname: p.lastname,
    username: p.username,
    stravaAthleteId: p.stravaAthleteId,
    role: p.role,
    createdAt: toIso(p.createdAt),
    updatedAt: toIso(p.updatedAt)
  };
}

export function toChallengeContributionDTO(c: ChallengeContribution): ChallengeContributionDTO {
  return {
    id: c.id,
    participantId: c.participantId,
    stravaActivityId: c.stravaActivityId,
    activityName: c.activityName,
    distance: c.distance,
    time: c.time,
    isValid: c.isValid,
    occurredAt: toIso(c.occurredAt),
    createdAt: toIso(c.createdAt)
  };
}

export function toChallengeParticipantDTO(
  p: ChallengeParticipant & { profile: Profile; contributions: ChallengeContribution[] }
): ChallengeParticipantDTO {
  return {
    id: p.id,
    challengeId: p.challengeId,
    profileId: p.profileId,
    status: p.status,
    joinedAt: p.joinedAt ? toIso(p.joinedAt) : null,
    resultDistance: p.resultDistance,
    resultTime: p.resultTime,
    highlightActivityId: p.highlightActivityId,
    createdAt: toIso(p.createdAt),
    updatedAt: toIso(p.updatedAt),
    profile: toProfileDTO(p.profile),
    contributions: p.contributions.map(toChallengeContributionDTO)
  };
}

export function toChallengeDTO(c: Challenge): ChallengeDTO {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    type: c.type,
    goalDistance: c.goalDistance,
    segmentId: c.segmentId,
    startDate: toIso(c.startDate),
    endDate: toIso(c.endDate),
    status: c.status,
    isActive: c.isActive,
    createdAt: toIso(c.createdAt),
    updatedAt: toIso(c.updatedAt)
  };
}

export function toChallengeWithParticipationDTO(
  c: Challenge,
  isParticipating: boolean,
  participant: (ChallengeParticipant & { profile: Profile; contributions: ChallengeContribution[] }) | null
): ChallengeWithParticipationDTO {
  return {
    ...toChallengeDTO(c),
    isParticipating,
    participant: participant ? toChallengeParticipantDTO(participant) : null
  };
}
```

---

## 6. Hydrator Functions (Client)

**File:** `src/routes/(app)/dashboard/_logic/hydrators.ts`

```ts
import type {
  ProfileDTO,
  ChallengeContributionDTO,
  ChallengeParticipantDTO,
  ChallengeWithParticipationDTO,
  DashboardPageDataDTO
} from '../_types/dto.js';
import type {
  ProfileHydrated,
  ChallengeContributionHydrated,
  ChallengeParticipantWithRelationsHydrated,
  ChallengeWithParticipationHydrated,
  DashboardContextDataHydrated
} from '../_types/hydrated.js';

function parseDate(s: string): Date {
  return new Date(s);
}

export function hydrateProfile(dto: ProfileDTO): ProfileHydrated {
  return {
    ...dto,
    createdAt: parseDate(dto.createdAt),
    updatedAt: parseDate(dto.updatedAt)
  };
}

export function hydrateChallengeContribution(dto: ChallengeContributionDTO): ChallengeContributionHydrated {
  return {
    ...dto,
    occurredAt: parseDate(dto.occurredAt),
    createdAt: parseDate(dto.createdAt)
  };
}

export function hydrateChallengeParticipant(dto: ChallengeParticipantDTO): ChallengeParticipantWithRelationsHydrated {
  return {
    ...dto,
    joinedAt: dto.joinedAt ? parseDate(dto.joinedAt) : null,
    createdAt: parseDate(dto.createdAt),
    updatedAt: parseDate(dto.updatedAt),
    profile: hydrateProfile(dto.profile),
    contributions: dto.contributions.map(hydrateChallengeContribution)
  };
}

export function hydrateChallengeWithParticipation(
  dto: ChallengeWithParticipationDTO
): ChallengeWithParticipationHydrated {
  return {
    ...dto,
    startDate: parseDate(dto.startDate),
    endDate: parseDate(dto.endDate),
    createdAt: parseDate(dto.createdAt),
    updatedAt: parseDate(dto.updatedAt),
    participant: dto.participant ? hydrateChallengeParticipant(dto.participant) : null
  };
}

export function hydrateDashboardData(dto: DashboardPageDataDTO): DashboardContextDataHydrated {
  return {
    profile: dto.profile ? hydrateProfile(dto.profile) : null,
    challengesWithParticipation: dto.challengesWithParticipation.map(hydrateChallengeWithParticipation),
    challengeParticipantsWithRelationsByChallenge: Object.fromEntries(
      Object.entries(dto.challengeParticipantsWithRelationsByChallenge).map(([k, arr]) => [
        k,
        arr.map(hydrateChallengeParticipant)
      ])
    )
  };
}
```

---

## 7. `+page.server.ts` Changes

```ts
// +page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { isChallengeJoinable } from '$lib/utils/challenge.js';
import {
  checkUserParticipation,
  joinChallenge,
  loadChallenge,
  leaveChallenge,
  loadChallengeParticipantWithRelations,
  loadDashboardData
} from './loader.server.js';
import {
  toProfileDTO,
  toChallengeParticipantDTO,
  toChallengeWithParticipationDTO
} from './_server/mappers.server.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ parent }) => {
  const { profile } = await parent();

  if (!profile) {
    throw redirect(302, '/');
  }

  const raw = await loadDashboardData(profile.id);

  return {
    profile: toProfileDTO(profile),
    challengesWithParticipation: raw.challengesWithParticipation.map((c) =>
      toChallengeWithParticipationDTO(c, c.isParticipating, c.participant)
    ),
    challengeParticipantsWithRelationsByChallenge: Object.fromEntries(
      Object.entries(raw.challengeParticipantsWithRelationsByChallenge).map(([id, arr]) => [
        id,
        arr.map(toChallengeParticipantDTO)
      ])
    )
  };
};

export const actions = {
  joinChallenge: async ({ request, locals }) => {
    // ... existing validation ...

    try {
      const { id } = await joinChallenge(challengeId, profile.id);
      const cp = await loadChallengeParticipantWithRelations(id);
      if (!cp) throw new Error('Failed to load participant after joining.');
      return {
        success: true,
        challengeParticipantWithRelations: toChallengeParticipantDTO(cp)
      };
    } catch (error) {
      // ...
    }
  },
  leaveChallenge: async ({ request, locals }) => {
    // ... existing logic ...
    return { success: true, challengeId };
  }
};
```

---

## 8. `loader.server.ts` Changes

**No changes required.** `loadDashboardData` continues to return internal schema-based types. Mapping happens in `+page.server.ts` before returning to the client.

---

## 9. Context Changes

**File:** `src/routes/(app)/dashboard/_logic/context.ts`

```ts
import type { DashboardPageDataDTO } from '../_types/dto.js';
import { hydrateDashboardData } from './hydrators.js';
import { getContext, setContext } from 'svelte';
import { getUserPreferencesContext } from '$lib/state/user-preferences.svelte.js';
import { DashboardUI } from './DashboardUI.svelte.js';

const KEY = Symbol('DASHBOARD_CTX');

export function setDashboardContext(data: DashboardPageDataDTO) {
  const prefs = getUserPreferencesContext();
  const hydrated = hydrateDashboardData(data);
  const dashboard = new DashboardUI(
    hydrated.challengesWithParticipation,
    hydrated.challengeParticipantsWithRelationsByChallenge,
    prefs.distanceUnit
  );
  return setContext<DashboardUI>(KEY, dashboard);
}

export function getDashboardContext(): DashboardUI {
  return getContext<DashboardUI>(KEY);
}
```

- Remove `DashboardUI.fromServerData`; context hydrates and constructs directly.
- `setDashboardContext` now accepts `DashboardPageDataDTO`.

---

## 10. `DashboardUI` Changes

**File:** `src/routes/(app)/dashboard/_logic/DashboardUI.svelte.ts`

- Replace imports: use `ChallengeParticipantWithRelationsHydrated` and `ChallengeWithParticipationHydrated` from `../_types/hydrated.js` instead of `$lib/types/dashboard.js`.
- Constructor signature: accept hydrated types.
- `updateFromServerData`: accept `DashboardPageDataDTO`, hydrate, then pass hydrated data to each challenge:

```ts
import type {
  ChallengeParticipantWithRelationsHydrated,
  ChallengeWithParticipationHydrated
} from '../_types/hydrated.js';
import type { DashboardPageDataDTO } from '../_types/dto.js';
import { hydrateDashboardData } from './hydrators.js';

// Constructor uses hydrated types
constructor(
  challengesWithParticipation: ChallengeWithParticipationHydrated[],
  challengeParticipantsWithRelationsByChallenge: Record<
    string,
    ChallengeParticipantWithRelationsHydrated[]
  >,
  distanceUnit: DistanceUnit
) { /* ... */ }

updateFromServerData(data: DashboardPageDataDTO) {
  const hydrated = hydrateDashboardData(data);
  hydrated.challengesWithParticipation.forEach((challengeData) => {
    const existingChallenge = this.challenges.find((c) => c.id === challengeData.id);
    if (existingChallenge) {
      const participants =
        hydrated.challengeParticipantsWithRelationsByChallenge[challengeData.id] ?? [];
      existingChallenge.updateFromServerData(challengeData, participants);
    }
  });
}
```

---

## 11. `ChallengeUI` Changes

**File:** `src/routes/(app)/dashboard/_logic/ChallengeUI.svelte.ts`

- Replace imports with hydrated types from `../_types/hydrated.js`.
- Constructor, `join()`, and `updateFromServerData()` all use hydrated types.
- `startDate` and `endDate` remain `Date` (already parsed by hydration).

---

## 12. `LeaderboardUI` Changes

**File:** `src/routes/(app)/dashboard/_logic/LeaderboardUI.svelte.ts`

- Import `ChallengeParticipantWithRelationsHydrated` and `LeaderboardRowData` from `../_types/hydrated.js`.
- Replace `ChallengeParticipantWithRelations` with `ChallengeParticipantWithRelationsHydrated` throughout.
- `ChallengeStats` can remain in `$lib/types/dashboard.ts` if shared, or move to hydrated if dashboard-only.

---

## 13. `JoinChallengeButton` Changes

**File:** `src/routes/(app)/dashboard/_components/challenges/JoinChallengeButton.svelte`

```ts
import { hydrateChallengeParticipant } from '../../_logic/hydrators.js';
import type { JoinChallengeActionResultDTO } from '../../_types/dto.js';

// In use:enhance callback:
if (result.type === 'success') {
  const payload = result.data as JoinChallengeActionResultDTO;
  const hydrated = hydrateChallengeParticipant(payload.challengeParticipantWithRelations);
  challenge.join(hydrated);
  await update();
}
```

---

## 14. `+page.svelte` Changes

No structural changes. `data` is `DashboardPageDataDTO` after load. The existing `$effect` that calls `dashboard.updateFromServerData(data)` continues to work; `updateFromServerData` now accepts the DTO and hydrates internally.

---

## 15. `$lib/types/dashboard.ts` Changes

- Remove or deprecate: `ChallengeWithParticipation`, `ChallengeParticipantWithRelations`, `DashboardContextData`.
- Keep `ChallengeStats` if used elsewhere (e.g. `LeaderboardUI`).
- `LeaderboardRowData` moves to `dashboard/_types/hydrated.ts`.

---

## 16. Components Using `Profile`

Components that receive `profile` (e.g. `ChallengesDrawer`, `DashboardChallengesSidebar`, `ChallengeListItems`) get it from `data.profile`. After the change, that is `ProfileDTO`. For display (name, username), the DTO shape is sufficient. If any component needs `Date` methods on profile fields, use `ProfileHydrated` from context or pass a hydrated profile.

**Note:** The layout returns `profile` from parent. If the app layout load also returns profile, it should map with `toProfileDTO` for consistency. The dashboard page receives `profile` from `data` (parent + page merged), so ensure the layout load returns a DTO if the dashboard expects it.

---

## 17. `$lib/utils/challenge.ts` Changes

- `calculateTotalDistance`: Update parameter type from `ChallengeParticipantWithRelations[]` to `ChallengeParticipantWithRelationsHydrated[]` (or a shared interface that both satisfy).
- `getChallengeTimeStateFromDates`: Already accepts `Date | string`; no change.
- `isChallengeJoinable`: If it accepts `Challenge`, update to accept `ChallengeDTO | ChallengeWithParticipationHydrated` or ensure the passed object has `endDate` as `Date | string` (both work with `new Date()`).

---

## 18. Execution Order

1. Create `_types/dto.ts` and `_types/hydrated.ts`.
2. Create `_server/mappers.server.ts` and `_logic/hydrators.ts`.
3. Update `+page.server.ts` load and actions to use mappers.
4. Update `context.ts` to hydrate before constructing `DashboardUI`.
5. Update `DashboardUI`, `ChallengeUI`, `LeaderboardUI` to use hydrated types.
6. Update `JoinChallengeButton` to hydrate action result before calling `join()`.
7. Update `$lib/utils/challenge.ts` for hydrated types where needed.
8. Clean up `$lib/types/dashboard.ts` and fix component imports.
9. Run `npm run build` and fix any remaining type errors.

---

## 19. Files Summary

| File | Action |
|------|--------|
| `dashboard/_types/dto.ts` | **Create** — DTO type definitions |
| `dashboard/_types/hydrated.ts` | **Create** — Hydrated type definitions |
| `dashboard/_server/mappers.server.ts` | **Create** — DB → DTO mappers |
| `dashboard/_logic/hydrators.ts` | **Create** — DTO → hydrated hydrators |
| `dashboard/+page.server.ts` | **Update** — Map load/action output to DTOs |
| `dashboard/_logic/context.ts` | **Update** — Hydrate before DashboardUI, accept DTO |
| `dashboard/_logic/DashboardUI.svelte.ts` | **Update** — Use hydrated types, accept DTO in updateFromServerData |
| `dashboard/_logic/ChallengeUI.svelte.ts` | **Update** — Use hydrated types |
| `dashboard/_logic/LeaderboardUI.svelte.ts` | **Update** — Use hydrated types |
| `dashboard/_components/challenges/JoinChallengeButton.svelte` | **Update** — Hydrate action result |
| `$lib/types/dashboard.ts` | **Update** — Remove/deprecate schema-based types, keep ChallengeStats |
| `$lib/utils/challenge.ts` | **Update** — Use hydrated types where applicable |
