import {
	CHALLENGE_TYPE,
	RANKING_METRIC,
	LONG_DISTANCE_LABEL,
	PARTICIPANT_STATUS,
	type ChallengeType,
	type DistanceUnit,
	type RankingMetric
} from '$lib/constants';
import type {
	LeaderboardRowData,
	ChallengeParticipantWithRelations,
	ChallengeStats
} from '$lib/types/dashboard.js';
import { calculateTotalDistance } from '$lib/utils/challenge.js';

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
	private goalDistance: number | null;
	private challengeType: ChallengeType;
	private rankingMetric: RankingMetric;
	private distanceUnit: DistanceUnit;

	leaderboardRows: LeaderboardRowData[];

	totalRunners: number;
	finishers: number;
	activeRunners: number;
	totalDistance: string;
	stats: ChallengeStats;

	constructor(
		challengeParticipantsWithRelations: ChallengeParticipantWithRelations[],
		goalDistance: number | null,
		challengeType: ChallengeType,
		rankingMetric: RankingMetric,
		distanceUnit: DistanceUnit
	) {
		this.challengeParticipantsWithRelations = $state(challengeParticipantsWithRelations);
		this.goalDistance = $state(goalDistance);
		this.challengeType = challengeType;
		this.rankingMetric = rankingMetric;
		this.distanceUnit = distanceUnit;
		this.leaderboardRows = $derived.by(() => {
			const sorted = [...this.challengeParticipantsWithRelations].sort((a, b) => {
				const statusA = STATUS_ORDER[a.status ?? ''] ?? 4;
				const statusB = STATUS_ORDER[b.status ?? ''] ?? 4;
				if (statusA !== statusB) return statusA - statusB;

				const rankA = a.rankingValueSeconds;
				const rankB = b.rankingValueSeconds;
				if (rankA == null && rankB == null) {
					if (this.rankingMetric !== RANKING_METRIC.NONE) return 0;
					if (this.challengeType === CHALLENGE_TYPE.SEGMENT_RACE) {
						const movingA = a.resultMovingTimeTotal ?? Infinity;
						const movingB = b.resultMovingTimeTotal ?? Infinity;
						return movingA - movingB;
					}
					const distA = a.resultDistance ?? -1;
					const distB = b.resultDistance ?? -1;
					return distB - distA;
				}
				if (rankA == null) return 1;
				if (rankB == null) return -1;
				return rankA - rankB;
			});

			return sorted.map((participant, idx) => {
				const isRanked = participant.rankingValueSeconds != null;
				const isFinished = participant.status === PARTICIPANT_STATUS.COMPLETED;

				const row: LeaderboardRowData = {
					participant,
					profile: participant.profile,
					//TODO: Should this be highlight activity?
					contribution: participant.contributions?.[0] || null,
					rank: isRanked && isFinished ? idx + 1 : null
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
		this.totalDistance = $derived(
			calculateTotalDistance(
				this.challengeParticipantsWithRelations,
				this.goalDistance,
				this.distanceUnit
			)
		);
		this.stats = $derived({
			totalRunners: this.totalRunners,
			finishers: this.finishers,
			activeRunners: this.activeRunners,
			totalDistance: this.totalDistance,
			totalDistanceLabel: LONG_DISTANCE_LABEL[this.distanceUnit]
		});
	}

	updateChallengeParticipantsWithRelations(
		challengeParticipantsWithRelations: ChallengeParticipantWithRelations[]
	) {
		this.challengeParticipantsWithRelations = challengeParticipantsWithRelations;
	}

	updateGoalDistance(goalDistance: number | null) {
		this.goalDistance = goalDistance;
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
