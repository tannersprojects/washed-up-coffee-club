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
	initialSelectedChallengeId: string | null;
};

/**
 * Leaderboard row structure matching buildLeaderboard() function.
 *
 * Display strings (`primaryValue`, `primaryLabel`, `secondaryLine`) are derived
 * in `LeaderboardUI` from the participant + challenge + metric so the row
 * template stays a pure renderer.
 */
export type LeaderboardRowData = {
	participant: ChallengeParticipantWithRelations;
	profile: Profile;
	contribution: ChallengeContribution | null;
	rank: number | null;
	primaryValue: string;
	primaryLabel: string;
	secondaryLine: string;
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
