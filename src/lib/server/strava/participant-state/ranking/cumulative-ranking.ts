import { RANKING_METRIC, RANKING_METRIC_BEST_EFFORT_NAME, RANKING_METRIC_DISTANCES, type RankingMetric } from '$lib/constants';
import type { ChallengeContribution } from '$lib/db/schema';
import type { ChallengeBestEffortsSnapshot } from '$lib/types/challenge-ranking';
import { getPreferredTime } from './shared-ranking';

const DISTANCE_TOLERANCE_RATIO = 0.01;

export function computeCumulativeRankingValue(
	contributions: ChallengeContribution[],
	metric: RankingMetric
): number | null {
	if (metric === RANKING_METRIC.NONE) return null;

	let bestTime: number | null = null;
	for (const contribution of contributions) {
		const time =
			metric === RANKING_METRIC.ACTIVITY_TOTAL
				? getPreferredTime(contribution.movingTime, contribution.elapsedTime)
				: extractCumulativeRankingValueFromBestEfforts(contribution.bestEfforts, metric);

		if (time == null) continue;
		if (bestTime == null || time < bestTime) {
			bestTime = time;
		}
	}

	return bestTime;
}

function extractCumulativeRankingValueFromBestEfforts(
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
