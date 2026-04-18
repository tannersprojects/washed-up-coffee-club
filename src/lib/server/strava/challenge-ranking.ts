import { RANKING_METRIC, RANKING_METRIC_DISTANCES, type RankingMetric } from '$lib/constants';
import type { ChallengeContribution } from '$lib/db/schema';
import type { ChallengeBestEffortsSnapshot } from '$lib/types/challenge-ranking';

const DISTANCE_TOLERANCE_RATIO = 0.01;

export function extractRankingValueFromBestEfforts(
	bestEffortsJson: ChallengeBestEffortsSnapshot | null,
	metric: RankingMetric
): number | null {
	if (!bestEffortsJson || bestEffortsJson.length === 0) return null;

	const targetMeters = RANKING_METRIC_DISTANCES[metric];
	if (targetMeters == null || targetMeters <= 0) return null;

	let bestTime: number | null = null;

	for (const effort of bestEffortsJson) {
		const distance = effort.distance;
		if (!distance || distance <= 0) continue;

		const deltaRatio = Math.abs(distance - targetMeters) / targetMeters;
		if (deltaRatio > DISTANCE_TOLERANCE_RATIO) continue;

		const time = getPreferredTime(effort.movingTime, effort.elapsedTime);
		if (time == null) continue;

		if (bestTime == null || time < bestTime) {
			bestTime = time;
		}
	}

	return bestTime;
}

export function computeRankingValueFromContributions(
	contributions: ChallengeContribution[],
	metric: RankingMetric
): number | null {
	if (metric === RANKING_METRIC.NONE) return null;

	let bestTime: number | null = null;
	for (const contribution of contributions) {
		const time =
			metric === RANKING_METRIC.ACTIVITY_TOTAL
				? getPreferredTime(contribution.movingTime, contribution.elapsedTime)
				: extractRankingValueFromBestEfforts(contribution.bestEfforts, metric);

		if (time == null) continue;
		if (bestTime == null || time < bestTime) {
			bestTime = time;
		}
	}

	return bestTime;
}

export function sumDistances(contributions: Array<{ distance: number | null }>): number {
	return contributions.reduce((acc, c) => acc + (c.distance ?? 0), 0);
}

export function sumMovingTimes(contributions: Array<{ movingTime: number | null }>): number {
	return contributions.reduce((acc, c) => acc + (c.movingTime ?? 0), 0);
}

// TODO: Reserved for segment-race support — participant-state currently stubs segment metrics;
// keep until segment ranking consumes this helper again.
export function getFastestContribution(
	contributions: Array<{
		stravaActivityId: number;
		distance: number | null;
		movingTime: number | null;
		elapsedTime: number | null;
	}>
): { stravaActivityId: number; distance: number | null; movingTime: number } | null {
	let best: { stravaActivityId: number; distance: number | null; movingTime: number } | null = null;
	for (const contribution of contributions) {
		const movingTime = contribution.movingTime ?? contribution.elapsedTime ?? null;
		if (movingTime == null || movingTime <= 0) continue;
		if (best == null || movingTime < best.movingTime) {
			best = {
				stravaActivityId: contribution.stravaActivityId,
				distance: contribution.distance,
				movingTime
			};
		}
	}
	return best;
}

export function getPreferredTime(
	movingTime: number | null | undefined,
	elapsedTime: number | null | undefined
): number | null {
	if (movingTime != null && movingTime > 0) return movingTime;
	if (elapsedTime != null && elapsedTime > 0) return elapsedTime;
	return null;
}
