import {
	RANKING_METRIC,
	RANKING_METRIC_BEST_EFFORT_NAME,
	RANKING_METRIC_DISTANCES,
	type RankingMetric
} from '$lib/constants';
import type { ChallengeContribution } from '$lib/db/schema';
import type { ChallengeBestEffortsSnapshot } from '$lib/types/challenge-ranking';
import {
	DISTANCE_TOLERANCE_RATIO,
	getPreferredTime,
	sumDistances,
	sumMovingTimes
} from './shared-ranking';

type CumulativeRankingContext = {
	contributions: ChallengeContribution[];
	rankingMetric: RankingMetric;
	goalDistance: number | null;
};

type HighlightContribution = {
	stravaActivityId: number;
	distance: number;
	tieBreakTime: number | null;
};

export function computeCumulativeRankingValue({
	contributions,
	rankingMetric,
	goalDistance
}: CumulativeRankingContext): number | null {
	// Product rule: cumulative + ACTIVITY_TOTAL ranks by cumulative moving time (lower is better).
	if (rankingMetric === RANKING_METRIC.ACTIVITY_TOTAL) {
		return sumMovingTimes(contributions);
	}

	const ruleAValue = computeCumulativeRuleARankingValue(contributions, rankingMetric);
	if (ruleAValue != null) return ruleAValue;

	return computeCumulativeRuleBRankingValue({
		contributions,
		rankingMetric,
		goalDistance
	});
}

export function selectCumulativeHighlightActivityId(
	contributions: ChallengeContribution[]
): number | null {
	let best: HighlightContribution | null = null;

	for (const contribution of contributions) {
		const distance = contribution.distance ?? null;
		if (distance == null) continue;

		const candidateTime = getPreferredTime(contribution.movingTime, contribution.elapsedTime);

		if (best == null || distance > best.distance) {
			best = {
				stravaActivityId: contribution.stravaActivityId,
				distance,
				tieBreakTime: candidateTime
			};
			continue;
		}

		if (distance === best.distance) {
			const isBetter =
				(best.tieBreakTime == null && candidateTime != null) ||
				(candidateTime != null && best.tieBreakTime != null && candidateTime < best.tieBreakTime) ||
				(candidateTime === best.tieBreakTime &&
					contribution.stravaActivityId < best.stravaActivityId);

			if (isBetter) {
				best = {
					stravaActivityId: contribution.stravaActivityId,
					distance,
					tieBreakTime: candidateTime
				};
			}
		}
	}

	return best?.stravaActivityId ?? null;
}

export function computeCumulativeRuleARankingValue(
	contributions: ChallengeContribution[],
	metric: RankingMetric
): number | null {
	if (metric === RANKING_METRIC.NONE) return null;

	let bestTime: number | null = null;
	for (const contribution of contributions) {
		const time = getRuleARankingTimeForContribution(contribution, metric);

		if (time == null) continue;
		if (bestTime == null || time < bestTime) {
			bestTime = time;
		}
	}

	return bestTime;
}

function computeCumulativeRuleBRankingValue({
	contributions,
	rankingMetric,
	goalDistance
}: CumulativeRankingContext): number | null {
	const targetMetricDistance = RANKING_METRIC_DISTANCES[rankingMetric];
	const totalDistance = sumDistances(contributions);
	const totalMovingTime = sumMovingTimes(contributions);

	if (
		!isCumulativeRuleBEligible({
			rankingMetric,
			goalDistance,
			targetMetricDistance,
			totalDistance,
			totalMovingTime
		})
	) {
		return null;
	}

	return deriveCumulativeRuleBTime({
		targetMetricDistance,
		totalDistance,
		totalMovingTime
	});
}

function isCumulativeRuleBEligible({
	rankingMetric,
	goalDistance,
	targetMetricDistance,
	totalDistance,
	totalMovingTime
}: {
	rankingMetric: RankingMetric;
	goalDistance: number | null;
	targetMetricDistance: number | null;
	totalDistance: number;
	totalMovingTime: number;
}): boolean {
	if (rankingMetric === RANKING_METRIC.NONE) return false;
	if (rankingMetric === RANKING_METRIC.ACTIVITY_TOTAL) return false;
	if (goalDistance == null || goalDistance <= 0) return false;
	if (targetMetricDistance == null || targetMetricDistance <= 0) return false;
	if (goalDistance !== targetMetricDistance) return false;
	if (!isWithinCumulativeFallbackDistanceTolerance(totalDistance, targetMetricDistance)) {
		return false;
	}
	if (totalMovingTime <= 0) return false;

	return true;
}

function isWithinCumulativeFallbackDistanceTolerance(
	totalDistance: number,
	targetMetricDistance: number
): boolean {
	if (totalDistance <= 0 || targetMetricDistance <= 0) return false;

	const minimumEligibleDistance = targetMetricDistance * (1 - DISTANCE_TOLERANCE_RATIO);
	return totalDistance >= minimumEligibleDistance;
}

function deriveCumulativeRuleBTime({
	targetMetricDistance,
	totalDistance,
	totalMovingTime
}: {
	targetMetricDistance: number | null;
	totalDistance: number;
	totalMovingTime: number;
}): number | null {
	if (targetMetricDistance == null || targetMetricDistance <= 0) return null;
	if (totalDistance <= 0 || totalMovingTime <= 0) return null;

	return Math.round(totalMovingTime * (targetMetricDistance / totalDistance));
}

function getRuleARankingTimeForContribution(
	contribution: ChallengeContribution,
	metric: RankingMetric
): number | null {
	if (metric === RANKING_METRIC.NONE) return null;

	return extractRuleARankingValueFromBestEfforts(contribution.bestEfforts, metric);
}

function extractRuleARankingValueFromBestEfforts(
	bestEffortsJson: ChallengeBestEffortsSnapshot | null,
	metric: RankingMetric
): number | null {
	if (!bestEffortsJson || bestEffortsJson.length === 0) {
		return null;
	}

	const targetName = RANKING_METRIC_BEST_EFFORT_NAME[metric];
	const targetMeters = RANKING_METRIC_DISTANCES[metric];

	if (targetName == null && (targetMeters == null || targetMeters <= 0)) {
		return null;
	}

	let bestTime: number | null = null;
	for (const effort of bestEffortsJson) {
		const nameMatches = targetName != null && effort.name === targetName;

		let distanceMatches = false;
		if (!nameMatches && targetMeters != null && targetMeters > 0) {
			const distance = effort.distance;
			if (distance != null && distance > 0) {
				const deltaRatio = Math.abs(distance - targetMeters) / targetMeters;
				distanceMatches = deltaRatio <= DISTANCE_TOLERANCE_RATIO;
			}
		}

		if (!nameMatches && !distanceMatches) continue;

		const time = getPreferredTime(effort.movingTime, effort.elapsedTime);
		if (time == null) continue;

		if (bestTime == null || time < bestTime) {
			bestTime = time;
		}
	}

	return bestTime;
}
