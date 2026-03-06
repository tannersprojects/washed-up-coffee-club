import type {
	Profile,
	Challenge,
	ChallengeParticipant,
	ChallengeContribution
} from '$lib/db/schema';
import type { LongDistanceLabel } from '$lib/constants';

/**
 * Challenge participant with relations loaded from query
 */
export type ChallengeParticipantWithRelations = ChallengeParticipant & {
	profile: Profile;
	contributions: ChallengeContribution[];
};

/**
 * Challenge with participants embedded. Participation status and current user's
 * participant are derived from participants (e.g. participants.find(p => p.profileId === profileId))
 */
export type DashboardChallenge = Challenge & {
	participants: ChallengeParticipantWithRelations[];
};

/**
 * Page data shape for dashboard route
 */
export type DashboardContextData = {
	profile: Profile;
	dashboardChallenges: DashboardChallenge[];
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
	totalDistance: string;
	totalDistanceLabel: LongDistanceLabel;
}
