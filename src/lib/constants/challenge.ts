export const CHALLENGE_STATUS = {
	UPCOMING: 'upcoming' as const,
	ACTIVE: 'active' as const,
	COMPLETED: 'completed' as const
} as const;

export type ChallengeStatus = (typeof CHALLENGE_STATUS)[keyof typeof CHALLENGE_STATUS];

export const CHALLENGE_TYPE = {
	BEST_EFFORT: 'best_effort' as const,
	SEGMENT_RACE: 'segment_race' as const,
	CUMULATIVE: 'cumulative' as const
} as const;

export type ChallengeType = (typeof CHALLENGE_TYPE)[keyof typeof CHALLENGE_TYPE];

export const CHALLENGE_JOIN_DISPLAY_STATE = {
	JOINABLE: 'joinable' as const,
	PARTICIPATING: 'participating' as const,
	ENDED: 'ended' as const,
	UPCOMING: 'upcoming' as const,
	NOT_ACTIVE: 'not_active' as const
} as const;

export type ChallengeJoinDisplayState =
	(typeof CHALLENGE_JOIN_DISPLAY_STATE)[keyof typeof CHALLENGE_JOIN_DISPLAY_STATE];

export const COUNTDOWN_LABEL = {
	TIME_UNTIL: 'Time Until',
	TIME_REMAINING: 'Time Remaining'
} as const;
