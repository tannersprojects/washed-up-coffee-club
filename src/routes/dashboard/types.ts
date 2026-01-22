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
export type LeaderboardRow = {
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
