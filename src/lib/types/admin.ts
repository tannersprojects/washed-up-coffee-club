import type { InferSelectModel } from 'drizzle-orm';
import type { Profile, ChallengeParticipant } from '$lib/db/schema';
import {
	memoriesTable,
	routineSchedulesTable,
	challengesTable
} from '$lib/db/schema';

/**
 * Canonical types for admin page data.
 * The admin page load returns AdminPageData; context and UI use this same type.
 */

export type { Profile };
export type MemoryRow = InferSelectModel<typeof memoriesTable>;
export type RoutineScheduleRow = InferSelectModel<typeof routineSchedulesTable>;
export type ChallengeRow = InferSelectModel<typeof challengesTable>;

export type ChallengeWithParticipants = ChallengeRow & {
	participants: ChallengeParticipant[];
};

/** Data returned by the admin loader (no profile). */
export type AdminLoadResult = {
	memories: MemoryRow[];
	routineSchedules: RoutineScheduleRow[];
	challenges: ChallengeWithParticipants[];
};

/** Data returned by the admin page load and passed to admin context. */
export type AdminPageData = {
	profile: Profile;
	memories: MemoryRow[];
	routineSchedules: RoutineScheduleRow[];
	challenges: ChallengeWithParticipants[];
};
