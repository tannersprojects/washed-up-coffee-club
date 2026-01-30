import { PARTICIPANT_STATUS } from '$lib/constants';
import type {
	LeaderboardRow,
	ChallengeStats,
	ChallengeParticipantWithRelations
} from '$lib/types/dashboard.js';
import { calculateTotalDistanceKm } from '$lib/utils/challenge-utils.js';

/**
 * LeaderboardUI class - Manages leaderboard data and statistics calculations
 *
 * This class transforms raw participant data into reactive leaderboard state with:
 * - Sorted leaderboard rows
 * - Derived statistics (total runners, finishers, active runners)
 * - Total distance calculations
 * - Challenge stats object for components
 */
export class LeaderboardUI {
	private challengeParticipantsWithRelations: ChallengeParticipantWithRelations[];
	private goalValue: number | null;

	leaderboardRows: LeaderboardRow[];

	totalRunners: number;
	finishers: number;
	activeRunners: number;
	totalDistanceKm: string;
	stats: ChallengeStats;

	constructor(
		challengeParticipantsWithRelations: ChallengeParticipantWithRelations[],
		goalValue: number | null
	) {
		this.challengeParticipantsWithRelations = $state(challengeParticipantsWithRelations);
		this.goalValue = $state(goalValue);
		// this.leaderboardRows = $state(this.buildLeaderboardRows());
		this.leaderboardRows = $derived.by(() => {
			let currentRank = 1;
			return this.challengeParticipantsWithRelations.map((participant) => {
				const isFinished = participant.status === PARTICIPANT_STATUS.COMPLETED;

				const row: LeaderboardRow = {
					participant,
					profile: participant.profile,
					// We grab the first contribution to display the activity name (e.g. "Morning Run")
					contribution: participant.contributions?.[0] || null,
					rank: isFinished ? currentRank++ : null
				};

				return row;
			});
		});

		this.totalRunners = $derived(this.challengeParticipantsWithRelations.length);
		this.finishers = $derived(
			this.challengeParticipantsWithRelations.filter(
				(p) => p.status === PARTICIPANT_STATUS.COMPLETED
			).length
		);
		this.activeRunners = $derived(
			this.challengeParticipantsWithRelations.filter(
				(p) => p.status === PARTICIPANT_STATUS.IN_PROGRESS
			).length
		);
		this.totalDistanceKm = $derived(
			calculateTotalDistanceKm(this.challengeParticipantsWithRelations, this.goalValue)
		);
		this.stats = $derived({
			totalRunners: this.totalRunners,
			finishers: this.finishers,
			activeRunners: this.activeRunners,
			totalDistanceKm: this.totalDistanceKm
		});
	}

	updateChallengeParticipantsWithRelations(
		challengeParticipantsWithRelations: ChallengeParticipantWithRelations[]
	) {
		this.challengeParticipantsWithRelations = challengeParticipantsWithRelations;
	}

	updateGoalValue(goalValue: number | null) {
		this.goalValue = goalValue;
	}

	addChallengeParticipantWithRelations(
		challengeParticipantWithRelations: ChallengeParticipantWithRelations
	) {
		this.challengeParticipantsWithRelations.push(challengeParticipantWithRelations);
	}

	removeChallengeParticipantWithRelations(challengeParticipantWithRelationsId: string) {
		this.challengeParticipantsWithRelations = this.challengeParticipantsWithRelations.filter(
			(p) => p.id !== challengeParticipantWithRelationsId
		);
	}
}
