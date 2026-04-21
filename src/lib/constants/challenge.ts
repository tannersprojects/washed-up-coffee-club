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

export const RANKING_METRIC_VALUES = [
	'none',
	'activity_total',
	'standard_400m',
	'standard_800m',
	'standard_1k',
	'standard_1_mile',
	'standard_2_mile',
	'standard_5k',
	'standard_10k',
	'standard_15k',
	'standard_10_mile',
	'standard_20k',
	'standard_half_marathon',
	'standard_30k',
	'standard_marathon',
	'standard_50k'
] as const;

export type RankingMetric = (typeof RANKING_METRIC_VALUES)[number];

export const RANKING_METRIC = {
	NONE: RANKING_METRIC_VALUES[0],
	ACTIVITY_TOTAL: RANKING_METRIC_VALUES[1],
	STANDARD_400M: RANKING_METRIC_VALUES[2],
	STANDARD_800M: RANKING_METRIC_VALUES[3],
	STANDARD_1K: RANKING_METRIC_VALUES[4],
	STANDARD_1_MILE: RANKING_METRIC_VALUES[5],
	STANDARD_2_MILE: RANKING_METRIC_VALUES[6],
	STANDARD_5K: RANKING_METRIC_VALUES[7],
	STANDARD_10K: RANKING_METRIC_VALUES[8],
	STANDARD_15K: RANKING_METRIC_VALUES[9],
	STANDARD_10_MILE: RANKING_METRIC_VALUES[10],
	STANDARD_20K: RANKING_METRIC_VALUES[11],
	STANDARD_HALF_MARATHON: RANKING_METRIC_VALUES[12],
	STANDARD_30K: RANKING_METRIC_VALUES[13],
	STANDARD_MARATHON: RANKING_METRIC_VALUES[14],
	STANDARD_50K: RANKING_METRIC_VALUES[15]
} as const;

// TODO(challenge-ranking-metric): Validate distances against more sample activities.
export const RANKING_METRIC_DISTANCES: Record<RankingMetric, number | null> = {
	[RANKING_METRIC.NONE]: null,
	[RANKING_METRIC.ACTIVITY_TOTAL]: null,
	[RANKING_METRIC.STANDARD_400M]: 400,
	[RANKING_METRIC.STANDARD_800M]: 805,
	[RANKING_METRIC.STANDARD_1K]: 1000,
	[RANKING_METRIC.STANDARD_1_MILE]: 1609,
	[RANKING_METRIC.STANDARD_2_MILE]: 3219,
	[RANKING_METRIC.STANDARD_5K]: 5000,
	[RANKING_METRIC.STANDARD_10K]: 10000,
	[RANKING_METRIC.STANDARD_15K]: 15000,
	[RANKING_METRIC.STANDARD_10_MILE]: 16093,
	[RANKING_METRIC.STANDARD_20K]: 20000,
	[RANKING_METRIC.STANDARD_HALF_MARATHON]: 21097,
	[RANKING_METRIC.STANDARD_30K]: 30000,
	[RANKING_METRIC.STANDARD_MARATHON]: 42195,
	[RANKING_METRIC.STANDARD_50K]: 50000
};

// TODO(strava-best-effort-names): Mapping is based on documented Strava labels
// (https://support.strava.com/hc/en-us/articles/16601494390285) plus the casing
// observed in sample webhook payloads. Validate against a few real `best_efforts`
// arrays from production and tighten anything that does not match exactly.
// `extractRankingValueFromBestEfforts` warns when distance-tolerance fallback
// rescues a contribution whose `name` was not in this table — use those logs to
// fix entries here.
export const RANKING_METRIC_LABEL: Record<RankingMetric, string> = {
	[RANKING_METRIC.NONE]: 'None (unranked)',
	[RANKING_METRIC.ACTIVITY_TOTAL]: 'Activity total moving time',
	[RANKING_METRIC.STANDARD_400M]: '400m',
	[RANKING_METRIC.STANDARD_800M]: '800m (1/2 mile)',
	[RANKING_METRIC.STANDARD_1K]: '1K',
	[RANKING_METRIC.STANDARD_1_MILE]: '1 mile',
	[RANKING_METRIC.STANDARD_2_MILE]: '2 mile',
	[RANKING_METRIC.STANDARD_5K]: '5K',
	[RANKING_METRIC.STANDARD_10K]: '10K',
	[RANKING_METRIC.STANDARD_15K]: '15K',
	[RANKING_METRIC.STANDARD_10_MILE]: '10 mile',
	[RANKING_METRIC.STANDARD_20K]: '20K',
	[RANKING_METRIC.STANDARD_HALF_MARATHON]: 'Half marathon',
	[RANKING_METRIC.STANDARD_30K]: '30K',
	[RANKING_METRIC.STANDARD_MARATHON]: 'Marathon',
	[RANKING_METRIC.STANDARD_50K]: '50K'
};

// Short variant used for compact leaderboard row labels.
export const RANKING_METRIC_SHORT_LABEL: Record<RankingMetric, string> = {
	[RANKING_METRIC.NONE]: 'Unranked',
	[RANKING_METRIC.ACTIVITY_TOTAL]: 'Activity time',
	[RANKING_METRIC.STANDARD_400M]: '400m',
	[RANKING_METRIC.STANDARD_800M]: '800m',
	[RANKING_METRIC.STANDARD_1K]: '1K',
	[RANKING_METRIC.STANDARD_1_MILE]: '1 mile',
	[RANKING_METRIC.STANDARD_2_MILE]: '2 mile',
	[RANKING_METRIC.STANDARD_5K]: '5K',
	[RANKING_METRIC.STANDARD_10K]: '10K',
	[RANKING_METRIC.STANDARD_15K]: '15K',
	[RANKING_METRIC.STANDARD_10_MILE]: '10 mile',
	[RANKING_METRIC.STANDARD_20K]: '20K',
	[RANKING_METRIC.STANDARD_HALF_MARATHON]: 'Half marathon',
	[RANKING_METRIC.STANDARD_30K]: '30K',
	[RANKING_METRIC.STANDARD_MARATHON]: 'Marathon',
	[RANKING_METRIC.STANDARD_50K]: '50K'
};

export const RANKING_METRIC_BEST_EFFORT_NAME: Record<RankingMetric, string | null> = {
	[RANKING_METRIC.NONE]: null,
	[RANKING_METRIC.ACTIVITY_TOTAL]: null,
	[RANKING_METRIC.STANDARD_400M]: '400m',
	[RANKING_METRIC.STANDARD_800M]: '1/2 mile',
	[RANKING_METRIC.STANDARD_1K]: '1K',
	[RANKING_METRIC.STANDARD_1_MILE]: '1 mile',
	[RANKING_METRIC.STANDARD_2_MILE]: '2 mile',
	[RANKING_METRIC.STANDARD_5K]: '5K',
	[RANKING_METRIC.STANDARD_10K]: '10K',
	[RANKING_METRIC.STANDARD_15K]: '15K',
	[RANKING_METRIC.STANDARD_10_MILE]: '10 mile',
	[RANKING_METRIC.STANDARD_20K]: '20K',
	[RANKING_METRIC.STANDARD_HALF_MARATHON]: 'Half-Marathon',
	[RANKING_METRIC.STANDARD_30K]: '30K',
	[RANKING_METRIC.STANDARD_MARATHON]: 'Marathon',
	[RANKING_METRIC.STANDARD_50K]: '50K'
};

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
