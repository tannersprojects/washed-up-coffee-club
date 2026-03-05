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

export const CHALLENGE_TYPES_WITH_GOAL_DISTANCE: readonly ChallengeType[] = [
	CHALLENGE_TYPE.CUMULATIVE,
	CHALLENGE_TYPE.BEST_EFFORT
];

export const CHALLENGE_STATUS_BADGE = {
	YOURE_IN: 'youre_in' as const,
	ENDED: 'ended' as const,
	NOT_ACTIVE: 'not_active' as const
} as const;

export type ChallengeStatusBadge =
	(typeof CHALLENGE_STATUS_BADGE)[keyof typeof CHALLENGE_STATUS_BADGE];

export const CHALLENGE_STATUS_BADGE_CONFIG: Record<
	ChallengeStatusBadge,
	{ label: string; classes: string }
> = {
	[CHALLENGE_STATUS_BADGE.YOURE_IN]: {
		label: "You're In",
		classes: 'border-(--accent-lime)/40 bg-(--accent-lime)/5 text-(--accent-lime)'
	},
	[CHALLENGE_STATUS_BADGE.ENDED]: {
		label: 'Challenge Ended',
		classes: 'border-gray-600 bg-gray-800/50 text-gray-400'
	},
	[CHALLENGE_STATUS_BADGE.NOT_ACTIVE]: {
		label: 'Not Active',
		classes: 'border-gray-600 bg-gray-800/50 text-gray-400'
	}
} as const;

export const COUNTDOWN_LABEL = {
	TIME_UNTIL: 'Time Until',
	TIME_REMAINING: 'Time Remaining'
} as const;
