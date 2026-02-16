import type { Challenge, ChallengeParticipant, Memory, RoutineSchedule } from '$lib/db/schema';

/**
 * Canonical types for admin page data.
 * The admin page load returns AdminPageData; context and UI use this same type.
 */

export type ChallengeWithParticipants = Challenge & {
	participants: ChallengeParticipant[];
};

/** Data returned by the admin loader (no profile). */
export type AdminContextData = {
	memories: Memory[];
	routineSchedules: RoutineSchedule[];
	challenges: ChallengeWithParticipants[];
};
