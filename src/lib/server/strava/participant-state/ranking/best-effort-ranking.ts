import {
	RANKING_METRIC,
	RANKING_METRIC_BEST_EFFORT_NAME,
	RANKING_METRIC_DISTANCES,
	type RankingMetric
} from '$lib/constants';
import type { ChallengeContribution } from '$lib/db/schema';
import type { ChallengeBestEffortsSnapshot } from '$lib/types/challenge-ranking';
import { getPreferredTime } from './shared-ranking';

const DISTANCE_TOLERANCE_RATIO = 0.01;
const FALLBACK_TOTAL_TOLERANCE_RATIO = 0.02;

type HighlightContribution = {
	stravaActivityId: number;
	distance: number | null;
	movingTime: number | null;
	elapsedTime: number | null;
};

export function computeBestEffortRankingValue(
	contributions: ChallengeContribution[],
	metric: RankingMetric
): number | null {
	let bestTime: number | null = null;
	for (const contribution of contributions) {
		const time = getMetricTimeForContribution(contribution, metric);
		if (time == null) continue;
		if (bestTime == null || time < bestTime) bestTime = time;
	}
	return bestTime;
}

export function selectBestEffortHighlightContribution(
	contributions: ChallengeContribution[],
	metric: RankingMetric
): HighlightContribution | null {
	if (metric === RANKING_METRIC.NONE) {
		return selectBestDistanceContribution(contributions);
	}

	let best: (HighlightContribution & { rankingValueSeconds: number }) | null = null;

	for (const contribution of contributions) {
		const rankingValueSeconds = getMetricTimeForContribution(contribution, metric);
		if (rankingValueSeconds == null) continue;
		const isBetter =
			best == null ||
			rankingValueSeconds < best.rankingValueSeconds ||
			(rankingValueSeconds === best.rankingValueSeconds &&
				contribution.stravaActivityId < best.stravaActivityId);
		if (isBetter) {
			best = {
				stravaActivityId: contribution.stravaActivityId,
				distance: contribution.distance,
				movingTime: contribution.movingTime,
				elapsedTime: contribution.elapsedTime,
				rankingValueSeconds
			};
		}
	}

	if (!best) return null;
	return {
		stravaActivityId: best.stravaActivityId,
		distance: best.distance,
		movingTime: best.movingTime,
		elapsedTime: best.elapsedTime
	};
}

function getMetricTimeForContribution(
	contribution: ChallengeContribution,
	metric: RankingMetric
): number | null {
	if (metric === RANKING_METRIC.NONE) return null;
	if (metric === RANKING_METRIC.ACTIVITY_TOTAL) {
		return getPreferredTime(contribution.movingTime, contribution.elapsedTime);
	}

	const fromSplits = extractRankingValueFromBestEfforts(contribution.bestEfforts, metric);
	if (fromSplits != null) return fromSplits;

	const target = RANKING_METRIC_DISTANCES[metric];
	if (target == null || contribution.distance == null) return null;

	const deltaRatio = Math.abs(contribution.distance - target) / target;
	if (deltaRatio > FALLBACK_TOTAL_TOLERANCE_RATIO) return null;

	return getPreferredTime(contribution.movingTime, contribution.elapsedTime);
}

function extractRankingValueFromBestEfforts(
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
			if (distance && distance > 0) {
				const deltaRatio = Math.abs(distance - targetMeters) / targetMeters;
				distanceMatches = deltaRatio <= DISTANCE_TOLERANCE_RATIO;
			}
		}

		if (!nameMatches && !distanceMatches) continue;

		if (!nameMatches && targetName != null) {
			console.warn(
				`[challenge-ranking] best_effort name fallback: metric=${metric} expected name="${targetName}" but matched by distance on entry name="${effort.name}" distance=${effort.distance}. Update RANKING_METRIC_BEST_EFFORT_NAME.`
			);
		}

		const time = getPreferredTime(effort.movingTime, effort.elapsedTime);
		if (time == null) continue;

		if (bestTime == null || time < bestTime) {
			bestTime = time;
		}
	}

	return bestTime;
}

function selectBestDistanceContribution(
	contributions: ChallengeContribution[]
): HighlightContribution | null {
	let best: (HighlightContribution & { distance: number; tieBreakTime: number | null }) | null =
		null;

	for (const contribution of contributions) {
		const distance = contribution.distance ?? null;
		if (distance == null) continue;

		const candidateTime = getPreferredTime(contribution.movingTime, contribution.elapsedTime);

		if (best == null || distance > best.distance) {
			best = {
				stravaActivityId: contribution.stravaActivityId,
				distance,
				movingTime: contribution.movingTime,
				elapsedTime: contribution.elapsedTime,
				tieBreakTime: candidateTime
			};
			continue;
		}

		if (distance === best.distance) {
			const swap =
				(best.tieBreakTime == null && candidateTime != null) ||
				(candidateTime != null && best.tieBreakTime != null && candidateTime < best.tieBreakTime) ||
				(candidateTime === best.tieBreakTime &&
					contribution.stravaActivityId < best.stravaActivityId);
			if (swap) {
				best = {
					stravaActivityId: contribution.stravaActivityId,
					distance,
					movingTime: contribution.movingTime,
					elapsedTime: contribution.elapsedTime,
					tieBreakTime: candidateTime
				};
			}
		}
	}

	if (!best) return null;
	return {
		stravaActivityId: best.stravaActivityId,
		distance: best.distance,
		movingTime: best.movingTime,
		elapsedTime: best.elapsedTime
	};
}
