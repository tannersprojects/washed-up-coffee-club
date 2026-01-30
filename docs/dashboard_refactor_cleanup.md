# Dashboard Refactor Cleanup

This document outlines improvements to clean up the dashboard refactoring implementation.

## 1. Constructor Initialization for Logic Classes

**Issue**: Properties are initialized with empty defaults outside the constructor, then re-assigned in the constructor.

### Dashboard.svelte.ts

**Current Implementation**:
```typescript
export class Dashboard {
  challenges = $state<Challenge[]>([]);
  leaderboards = $state<Record<string, Leaderboard>>({});
  selectedChallengeId = $state<string | null>(null);
  // ...
  
  constructor(data: DashboardServerData) {
    this.challenges = data.challenges.map((c) => new Challenge(c));
    // ...
  }
}
```

**Proposed Solution**: Initialize properties only in the constructor for clearer intent.

```typescript
export class Dashboard {
  challenges: Challenge[];
  leaderboards: Record<string, Leaderboard>;
  selectedChallengeId: string | null;
  activeTab: 'leaderboard' | 'details';
  isSubmitting: boolean;

  constructor(data: DashboardServerData) {
    // Initialize with actual data, not empty defaults
    this.challenges = $state(data.challenges.map((c) => new Challenge(c)));
    this.leaderboards = $state(
      Object.fromEntries(
        Object.entries(data.leaderboards).map(([id, rows]) => {
          const challenge = this.challenges.find((c) => c.id === id);
          return [id, new Leaderboard(rows, challenge?.goalValue ?? null)];
        })
      )
    );
    this.selectedChallengeId = $state(data.challenges[0]?.id || null);
    this.activeTab = $state('leaderboard');
    this.isSubmitting = $state(false);
    
    // Start countdown for first challenge
    if (this.challenges.length > 0) {
      this.challenges[0].startCountdown();
    }
  }
  
  // ... rest of class
}
```

### Leaderboard.svelte.ts

**Current Implementation**:
```typescript
export class Leaderboard {
  // Reactive state
  rows = $state<LeaderboardRow[]>([]);
  private goalValue: number | null;

  constructor(rows: LeaderboardRow[], goalValue: number | null) {
    this.rows = rows;
    this.goalValue = goalValue;
  }
}
```

**Proposed Solution**: Initialize `rows` with `$state` in constructor.

```typescript
export class Leaderboard {
  rows: LeaderboardRow[];
  private goalValue: number | null;

  constructor(rows: LeaderboardRow[], goalValue: number | null) {
    this.rows = $state(rows);
    this.goalValue = goalValue;
  }
  
  // ... rest of class (getters remain unchanged)
}
```

**Benefits**:
- Clearer initialization intent
- No redundant empty initializations
- Single source of truth for initial values
- Consistent pattern across all logic classes

## 2. Proper Types for Leaderboard Collections

**Issue**: Using `Awaited<ReturnType<typeof buildLeaderboard>>` is not ideal for type clarity.

**Current Implementation**:
```typescript
// In +page.server.ts
const leaderboards: Record<string, Awaited<ReturnType<typeof buildLeaderboard>>> = {};
```

### Solution A: Explicit Function Return Types (Recommended)

Add explicit return type to `buildLeaderboard`:

```typescript
import type { LeaderboardRow } from '$lib/types/dashboard.js';

function buildLeaderboard(
  challengeParticipants: Awaited<ReturnType<typeof loadChallengeParticipants>>
): LeaderboardRow[] {
  let currentRank = 1;
  const leaderboard = challengeParticipants.map((participant) => {
    const isFinished = participant.status === 'completed';

    return {
      participant,
      profile: participant.profile,
      contribution: participant.contributions?.[0] || null,
      rank: isFinished ? currentRank++ : null
    };
  });

  return leaderboard;
}

// Then in load function:
const leaderboards: Record<string, LeaderboardRow[]> = {};
```

### Solution B: Type Alias

Add to `src/lib/types/dashboard.ts`:

```typescript
export type ChallengeLeaderboards = Record<string, LeaderboardRow[]>;
```

Then use throughout:

```typescript
import type { ChallengeLeaderboards } from '$lib/types/dashboard.js';

// In +page.server.ts
const leaderboards: ChallengeLeaderboards = {};

// In Dashboard.svelte.ts
export type DashboardServerData = {
  challenges: ChallengeWithParticipation[];
  leaderboards: ChallengeLeaderboards;
};
```

**Recommendation**: Use Solution A (explicit return types) as it's more self-documenting and doesn't require additional type definitions.

## 3. Simplifying Participant Loading

**Issue**: Making redundant database queries - one to check user participation, another to load all participants.

**Current Implementation**:
- `checkUserParticipation()` - Queries for single user's participation
- `loadChallengeParticipants()` - Queries for all participants
- Result: 3 queries per challenge (challenge + user participation + all participants)

### Proposed Solution: Single Query Per Challenge

Eliminate `checkUserParticipation()` entirely and find user participation from the already-loaded participants:

```typescript
export const load = async ({ locals }: { locals: App.Locals }) => {
  const { session, user } = await locals.safeGetSession();
  const profile = locals.profile;

  if (!session || !user || !profile) {
    throw redirect(302, '/');
  }

  // Load all active challenges
  const challenges = await db.query.challengesTable.findMany({
    where: eq(challengesTable.isActive, true)
  });

  const leaderboards: Record<string, LeaderboardRow[]> = {};
  const challengesWithParticipation: ChallengeWithParticipation[] = [];

  // Single loop - load participants once per challenge
  for (const challenge of challenges) {
    const participants = await loadChallengeParticipants(challenge.id);
    
    // Find user's participation from the loaded data (no extra query!)
    const userParticipant = participants.find(p => p.profileId === profile.id);
    
    // Build challenge with participation status
    challengesWithParticipation.push({
      ...challenge,
      isParticipating: userParticipant !== undefined,
      participant: userParticipant || null
    });
    
    // Build leaderboard from same participant data
    leaderboards[challenge.id] = buildLeaderboard(participants);
  }

  return {
    user,
    profile,
    challenges: challengesWithParticipation,
    leaderboards
  };
};
```

**Benefits**:
- Reduces queries from 3 per challenge to 2 per challenge
- Simpler code - one less function to maintain
- Data consistency - user participation derived from same dataset as leaderboard

### What to Remove

After implementing the above changes, you can delete:

```typescript
// Delete this function - no longer needed
async function checkUserParticipation(challengeId: string, profileId: string) {
  const participant = await db.query.challengeParticipantsTable.findFirst({
    where: and(
      eq(challengeParticipantsTable.challengeId, challengeId),
      eq(challengeParticipantsTable.profileId, profileId)
    )
  });

  return participant || null;
}

// Delete this function - logic moved into load()
async function loadActiveChallenges(profileId: string): Promise<ChallengeWithParticipation[]> {
  // ...
}
```

## Implementation Priority

1. **High Priority**: Fix participant loading (#3) - immediate performance improvement
2. **Medium Priority**: Add explicit return types (#2) - improves code clarity
3. **Low Priority**: Constructor initialization (#1) - nice-to-have cleanup

## Files to Modify

- `src/routes/dashboard/+page.server.ts` - All three improvements
- `src/routes/dashboard/_logic/Dashboard.svelte.ts` - Constructor initialization (#1)
- `src/routes/dashboard/_logic/Leaderboard.svelte.ts` - Constructor initialization (#1)
- `src/lib/types/dashboard.ts` - Optional type alias (if using Solution B for #2)
