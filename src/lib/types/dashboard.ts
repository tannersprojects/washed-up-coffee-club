import type {
	Profile,
	Challenge,
	ChallengeParticipant,
	ChallengeContribution
} from '$lib/db/schema';

/**
 * Dashboard top-level tab (Challenges vs Club Leaderboard)
 */
export const DASHBOARD_TAB = {
	Challenges: 'challenges',
	ClubLeaderboard: 'club-leaderboard'
} as const;

export const DASHBOARD_TAB_LABEL = {
	Challenges: 'Challenges',
	ClubLeaderboard: 'Club Leaderboard'
} as const;

export type DashboardTab = (typeof DASHBOARD_TAB)[keyof typeof DASHBOARD_TAB];

export const LEADERBOARD_TAB = {
	Leaderboard: 'leaderboard',
	Details: 'details'
} as const;

export const LEADERBOARD_TAB_LABEL = {
	Leaderboard: 'Leaderboard',
	Details: 'Details'
} as const;

export type LeaderboardTab = (typeof LEADERBOARD_TAB)[keyof typeof LEADERBOARD_TAB];

/**
 * Challenge participant with relations loaded from query
 */
export type ChallengeParticipantWithRelations = ChallengeParticipant & {
	profile: Profile;
	contributions: ChallengeContribution[];
};

/**
 * Leaderboard row structure matching buildLeaderboard() function
 */
export type LeaderboardRowData = {
	participant: ChallengeParticipantWithRelations;
	profile: Profile;
	contribution: ChallengeContribution | null;
	rank: number | null;
};

/**
 * Challenge statistics for display in stats grid
 */
export interface ChallengeStats {
	totalRunners: number;
	finishers: number;
	activeRunners: number;
	totalDistanceKm: string;
}

/**
 * Challenge with participation status attached
 * This allows each challenge to carry its own participation status,
 * supporting multiple simultaneous challenges
 */
export type ChallengeWithParticipation = Challenge & {
	isParticipating: boolean;
	participant: ChallengeParticipant | null;
};

export type DashboardContextData = {
	challengesWithParticipation: ChallengeWithParticipation[];
	challengeParticipantsWithRelationsByChallenge: Record<
		string,
		ChallengeParticipantWithRelations[]
	>;
};
