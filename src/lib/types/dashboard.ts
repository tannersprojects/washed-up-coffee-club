import type {
	Profile,
	Challenge,
	ChallengeParticipant,
	ChallengeContribution
} from '$lib/db/schema';

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
