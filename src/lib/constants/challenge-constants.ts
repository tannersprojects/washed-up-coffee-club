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
