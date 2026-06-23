export const DASHBOARD_QUERY_PARAM = {
	challenge: 'challenge'
} as const;

export const DASHBOARD_TAB = {
	Challenges: 'challenges',
	ClubLeaderboard: 'club-leaderboard'
} as const;

export type DashboardTab = (typeof DASHBOARD_TAB)[keyof typeof DASHBOARD_TAB];

export const DASHBOARD_TAB_LABEL = {
	Challenges: 'Challenges',
	ClubLeaderboard: 'Club Leaderboard'
} as const;

export const LEADERBOARD_TAB = {
	Leaderboard: 'leaderboard',
	Details: 'details'
} as const;

export type LeaderboardTab = (typeof LEADERBOARD_TAB)[keyof typeof LEADERBOARD_TAB];

export const LEADERBOARD_TAB_LABEL = {
	Leaderboard: 'Leaderboard',
	Details: 'Details'
} as const;
