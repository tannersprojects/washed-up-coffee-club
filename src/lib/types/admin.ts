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

export const ADMIN_TAB = {
	Memories: 'memories',
	Schedules: 'schedules',
	Challenges: 'challenges'
} as const;

export type AdminTab = (typeof ADMIN_TAB)[keyof typeof ADMIN_TAB];

export const ADMIN_TAB_LABEL = {
	Memories: 'Memories',
	Schedules: 'Schedules',
	Challenges: 'Challenges'
} as const;
