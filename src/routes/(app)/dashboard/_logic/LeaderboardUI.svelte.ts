import {
	CHALLENGE_TYPE,
	RANKING_METRIC,
	RANKING_METRIC_SHORT_LABEL,
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
import {
	calculateTotalDistance,
	formatDisplayTime,
	formatPace,
	formatTime
} from '$lib/utils/challenge.js';
import { formatDistanceDisplay } from '$lib/utils/distance.js';

const STATUS_ORDER: Record<string, number> = {
	[PARTICIPANT_STATUS.COMPLETED]: 0,
	[PARTICIPANT_STATUS.IN_PROGRESS]: 1,
	[PARTICIPANT_STATUS.REGISTERED]: 2,
	[PARTICIPANT_STATUS.DID_NOT_FINISH]: 3
};

type PrimarySecondary = {
	primaryValue: string;
	primaryLabel: string;
	secondaryLine: string;
};

/**
 * LeaderboardUI class - Manages leaderboard data and statistics calculations
 *
 * Transforms raw participant data into reactive leaderboard state with:
 * - Sorted leaderboard rows
 * - Derived statistics (total runners, finishers, active runners)
 * - Total distance calculations
 * - Challenge stats object for components
 * - Per-row display strings (primary value, metric label, secondary line) so
 *   the row template can stay a pure renderer.
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
			const sorted = [...this.challengeParticipantsWithRelations].sort((a, b) =>
				this.compareParticipants(a, b)
			);
			return sorted.map((participant, idx) => this.buildRow(participant, idx));
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

	private compareParticipants(
		a: ChallengeParticipantWithRelations,
		b: ChallengeParticipantWithRelations
	): number {
		const statusA = STATUS_ORDER[a.status ?? ''] ?? 4;
		const statusB = STATUS_ORDER[b.status ?? ''] ?? 4;
		if (statusA !== statusB) return statusA - statusB;

		const rankableA = this.isParticipantRankable(a);
		const rankableB = this.isParticipantRankable(b);
		if (rankableA !== rankableB) return rankableA ? -1 : 1;

		// NONE ranking metric: sort by distance desc, tie-break on faster moving time.
		if (this.rankingMetric === RANKING_METRIC.NONE) {
			const distA = a.resultDistance ?? -1;
			const distB = b.resultDistance ?? -1;
			if (distA !== distB) return distB - distA;
			const movingA = a.resultMovingTimeSeconds ?? Infinity;
			const movingB = b.resultMovingTimeSeconds ?? Infinity;
			return movingA - movingB;
		}

		// Otherwise, sort by rankingValueSeconds ascending, nulls last.
		const rankA = a.rankingValueSeconds;
		const rankB = b.rankingValueSeconds;
		if (rankA == null && rankB == null) return 0;
		if (rankA == null) return 1;
		if (rankB == null) return -1;
		return rankA - rankB;
	}

	private buildRow(
		participant: ChallengeParticipantWithRelations,
		idx: number
	): LeaderboardRowData {
		const contribution =
			participant.contributions?.find(
				(c) => c.stravaActivityId === participant.highlightActivityId
			) ?? null;

		const isRanked = this.isParticipantRankable(participant);

		const { primaryValue, primaryLabel, secondaryLine } = this.getPrimaryAndSecondary(participant);

		return {
			participant,
			profile: participant.profile,
			contribution,
			rank: isRanked ? idx + 1 : null,
			primaryValue,
			primaryLabel,
			secondaryLine
		};
	}

	private getPrimaryAndSecondary(
		participant: ChallengeParticipantWithRelations
	): PrimarySecondary {
		const metric = this.rankingMetric;
		const type = this.challengeType;
		const isNone = metric === RANKING_METRIC.NONE;
		const metricLabel = RANKING_METRIC_SHORT_LABEL[metric];

		const distanceDisplay =
			participant.resultDistance != null
				? formatDistanceDisplay(participant.resultDistance, this.distanceUnit)
				: null;
		const timeDisplay = formatDisplayTime(
			participant.resultMovingTimeSeconds,
			participant.resultElapsedTimeSeconds
		);
		const hasTime =
			participant.resultMovingTimeSeconds != null ||
			participant.resultElapsedTimeSeconds != null;
		const paceDisplay = formatPace(
			participant.resultMovingTimeSeconds,
			participant.resultElapsedTimeSeconds,
			participant.resultDistance,
			this.distanceUnit
		);
		const hasPace = paceDisplay !== '--';

		if (type === CHALLENGE_TYPE.CUMULATIVE && isNone) {
			const parts: string[] = [];
			if (hasTime) parts.push(`${timeDisplay} total`);
			if (hasPace) parts.push(paceDisplay);
			return {
				primaryValue: distanceDisplay ?? '--',
				primaryLabel: 'Total distance',
				secondaryLine: parts.join(' · ')
			};
		}

		if (type === CHALLENGE_TYPE.CUMULATIVE) {
			const canShowRanking = this.isParticipantRankable(participant);
			const primaryValue =
				canShowRanking && participant.rankingValueSeconds != null
					? formatTime(participant.rankingValueSeconds)
					: '--';
			const parts: string[] = [];
			if (distanceDisplay) parts.push(distanceDisplay);
			if (hasTime) parts.push(`${timeDisplay} total`);
			if (hasPace) parts.push(paceDisplay);
			return {
				primaryValue,
				primaryLabel: metricLabel,
				secondaryLine: parts.join(' · ')
			};
		}

		if (type === CHALLENGE_TYPE.BEST_EFFORT && isNone) {
			const parts: string[] = [];
			if (hasTime) parts.push(timeDisplay);
			if (hasPace) parts.push(paceDisplay);
			return {
				primaryValue: distanceDisplay ?? '--',
				primaryLabel: 'Longest run',
				secondaryLine: parts.join(' · ')
			};
		}

		if (type === CHALLENGE_TYPE.BEST_EFFORT) {
			const primaryValue =
				participant.rankingValueSeconds != null
					? formatTime(participant.rankingValueSeconds)
					: '--';
			const parts: string[] = [];
			if (distanceDisplay) parts.push(distanceDisplay);
			if (hasTime) parts.push(timeDisplay);
			if (hasPace) parts.push(paceDisplay);
			return {
				primaryValue,
				primaryLabel: metricLabel,
				secondaryLine: parts.join(' · ')
			};
		}

		// SEGMENT_RACE
		const primaryValue =
			participant.rankingValueSeconds != null
				? formatTime(participant.rankingValueSeconds)
				: '--';
		const parts: string[] = [];
		if (distanceDisplay) parts.push(distanceDisplay);
		if (hasTime) parts.push(timeDisplay);
		if (hasPace) parts.push(paceDisplay);
		return {
			primaryValue,
			primaryLabel: 'Segment time',
			secondaryLine: parts.join(' · ')
		};
	}

	private isParticipantRankable(participant: ChallengeParticipantWithRelations): boolean {
		if (
			this.challengeType === CHALLENGE_TYPE.CUMULATIVE &&
			participant.status !== PARTICIPANT_STATUS.COMPLETED
		) {
			return false;
		}

		if (this.rankingMetric === RANKING_METRIC.NONE) {
			return participant.resultDistance != null;
		}

		return participant.rankingValueSeconds != null;
	}
}
