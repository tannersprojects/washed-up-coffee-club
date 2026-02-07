# Dashboard Data Structure Refactor (Post–Admin MVP)

**Status:** Deferred until after admin dashboard MVP is complete.

This doc records options for refactoring how dashboard challenge + participant data is loaded and passed to the dashboard UI, and what would need to change in the dashboard loader, types, context, and `_logic` layer.

---

## Current Shape

- **Loader** (`src/routes/dashboard/loader.server.ts`) returns:
  - `challengesWithParticipation`: `ChallengeWithParticipation[]`
  - `challengeParticipantsWithRelationsByChallenge`: `Record<string, ChallengeParticipantWithRelations[]>`
- **Risk:** If a challenge has no participants, the record has no key for that challenge ID; consumers that do `record[challengeId]` get `undefined` and can throw (e.g. `.length` on undefined in `LeaderboardUI`). The loader was updated to pre-initialize an empty array for every challenge ID to avoid that.

---

## Options for Refactor

### Option 1: Single array of “challenge with participants” (recommended)

**Idea:** Drop the separate record. Each challenge object carries its own `participants` array. One array of objects, each with everything needed for that challenge.

**Type shape:**

```ts
type ChallengeWithParticipationAndParticipants = ChallengeWithParticipation & {
  participants: ChallengeParticipantWithRelations[];
};

type DashboardContextData = {
  challengesWithParticipation: ChallengeWithParticipationAndParticipants[];
};
```

**Pros:** Single source of truth, no missing-key bugs, simpler types and call sites.  
**Cons:** Slightly larger payload (participants duplicated per challenge; in practice we only have one list per challenge).

---

### Option 2: Keep the Record

- Keep `challengeParticipantsWithRelationsByChallenge: Record<string, ChallengeParticipantWithRelations[]>`.
- Ensure the loader **always** initializes an entry for every challenge ID (e.g. `challengeParticipantsWithRelationsByChallenge[challenge.id] = []` before filling from `allParticipants`).
- Optionally type it explicitly, e.g. `type ParticipantsByChallengeId = { [challengeId: string]: ChallengeParticipantWithRelations[] };`.

**Pros:** No refactor of consumer code; current pattern continues to work.  
**Cons:** Two parallel structures (challenges array + record) must stay in sync; lookups by ID everywhere.

---

## Changes Required (if Option 1 is chosen)

### 1. `src/lib/types/dashboard.ts`

- Add (or extend) type:
  - `ChallengeWithParticipationAndParticipants = ChallengeWithParticipation & { participants: ChallengeParticipantWithRelations[] }`.
- Change `DashboardContextData` to:
  - `{ challengesWithParticipation: ChallengeWithParticipationAndParticipants[] }` (remove `challengeParticipantsWithRelationsByChallenge`).

### 2. `src/routes/dashboard/loader.server.ts`

- In `loadDashboardData`:
  - Build a single array of challenges.
  - For each challenge, attach `participants: []` (and existing participation fields).
  - In one pass over `allParticipants`, push each participant into the correct challenge’s `participants` (e.g. by finding the challenge by id in the array, or by indexing once by `challenge.id` for O(1) lookup).
  - Return only `{ challengesWithParticipation }` (no separate record).

### 3. `src/routes/dashboard/_logic/context.ts`

- `setDashboardContext(data: DashboardContextData)` already takes `DashboardContextData`; no signature change if `DashboardContextData` is updated as above.
- Ensure the type import for `DashboardContextData` comes from `$lib/types/dashboard` and reflects the new shape (single array only).

### 4. `src/routes/dashboard/_logic/DashboardUI.svelte.ts`

- **Constructor:** Change from:
  - `(challengesWithParticipation, challengeParticipantsWithRelationsByChallenge)`  
  to:
  - `(challengesWithParticipation)` only (each item already has `.participants`).
- **Hydration:** Change from:
  - `new ChallengeUI(c, challengeParticipantsWithRelationsByChallenge[c.id])`  
  to:
  - `new ChallengeUI(c, c.participants)` (or equivalent, e.g. `new ChallengeUI(c)` if `ChallengeUI` reads `c.participants` from the first arg).
- **`fromServerData`:** Accept only `{ challengesWithParticipation }` and pass that single array into the constructor.
- **`updateFromServerData`:** Change from:
  - Looking up `challengeParticipantsWithRelationsByChallenge[challengeData.id]`  
  to:
  - Using `challengeData.participants` (each item in `challengesWithParticipation` already has `participants`).

### 5. `src/routes/dashboard/_logic/ChallengeUI.svelte.ts`

- **Constructor:** Second parameter is already `challengeParticipantsWithRelations: ChallengeParticipantWithRelations[]`; no type change.
- If the first argument becomes a `ChallengeWithParticipationAndParticipants`, the constructor can take that single object and pass `challenge.participants` into `LeaderboardUI`; no need for a second parameter if the type carries `participants`.

### 6. `src/routes/dashboard/_logic/LeaderboardUI.svelte.ts`

- No change required: it already receives `ChallengeParticipantWithRelations[]` and uses `.length` etc.; the array will always be defined (possibly empty) once it’s coming from the challenge object.

### 7. `src/routes/dashboard/+page.server.ts`

- Load function already returns the result of `loadDashboardData(profile.id)`; once the loader returns only `{ challengesWithParticipation }`, the page’s `data` will have that shape. No change needed except to avoid passing the removed record to any consumer.

---

## Summary

| Area              | Change |
|-------------------|--------|
| `$lib/types/dashboard.ts` | New/updated type; `DashboardContextData` = single array of challenge-with-participants. |
| `loader.server.ts`        | Build one array; attach `participants` per challenge; return only that array. |
| `context.ts`               | No API change; type import reflects new `DashboardContextData`. |
| `DashboardUI.svelte.ts`    | Constructor and `fromServerData` take single array; use `c.participants` for `ChallengeUI`; `updateFromServerData` uses `challengeData.participants`. |
| `ChallengeUI.svelte.ts`   | Optionally take single “challenge with participants” and pass `.participants` to `LeaderboardUI`. |
| `LeaderboardUI.svelte.ts` | No change. |
| `+page.server.ts`         | No change (loader return shape only). |
