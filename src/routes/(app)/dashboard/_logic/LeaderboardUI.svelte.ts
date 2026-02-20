import { CHALLENGE_TYPE, PARTICIPANT_STATUS } from '$lib/constants';
import type {
	LeaderboardRowData,
	ChallengeParticipantWithRelations,
	ChallengeStats
} from '$lib/types/dashboard.js';
import { calculateTotalDistanceKm } from '$lib/utils/challenge.js';

const STATUS_ORDER: Record<string, number> = {
	[PARTICIPANT_STATUS.COMPLETED]: 0,
	[PARTICIPANT_STATUS.IN_PROGRESS]: 1,
	[PARTICIPANT_STATUS.REGISTERED]: 2,
	[PARTICIPANT_STATUS.DID_NOT_FINISH]: 3
};

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
	private challengeType: string;

	leaderboardRows: LeaderboardRowData[];

	totalRunners: number;
	finishers: number;
	activeRunners: number;
	totalDistanceKm: string;
	stats: ChallengeStats;

	constructor(
		challengeParticipantsWithRelations: ChallengeParticipantWithRelations[],
		goalValue: number | null,
		challengeType: string
	) {
		this.challengeParticipantsWithRelations = $state(challengeParticipantsWithRelations);
		this.goalValue = $state(goalValue);
		this.challengeType = challengeType;
		this.leaderboardRows = $derived.by(() => {
			const sorted = [...this.challengeParticipantsWithRelations].sort((a, b) => {
				const statusA = STATUS_ORDER[a.status ?? ''] ?? 4;
				const statusB = STATUS_ORDER[b.status ?? ''] ?? 4;
				if (statusA !== statusB) return statusA - statusB;

				if (this.challengeType === CHALLENGE_TYPE.SEGMENT_RACE) {
					const timeA = a.resultTime ?? Infinity;
					const timeB = b.resultTime ?? Infinity;
					return timeA - timeB;
				}
				const distA = a.resultDistance ?? -1;
				const distB = b.resultDistance ?? -1;
				return distB - distA;
			});

			let currentRank = 1;
			return sorted.map((participant) => {
				const isFinished = participant.status === PARTICIPANT_STATUS.COMPLETED;

				const row: LeaderboardRowData = {
					participant,
					profile: participant.profile,
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
