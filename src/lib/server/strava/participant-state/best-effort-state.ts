import { RANKING_METRIC, RANKING_METRIC_DISTANCES, type RankingMetric } from '$lib/constants';
import type { Challenge, ChallengeContribution, ChallengeParticipant } from '$lib/db/schema';
import { extractRankingValueFromBestEfforts, getPreferredTime } from '../challenge-ranking';
import type { ParticipantStateResult } from './participant-state';

const FALLBACK_TOTAL_TOLERANCE_RATIO = 0.02;

export function computeMetricsForBestEffortChallenge(
	_participant: ChallengeParticipant,
	challenge: Challenge,
	_activityId: number,
	contributions: ChallengeContribution[]
): ParticipantStateResult {
	const goalDistance = challenge.goalDistance ?? 0;
	const goalMet = contributions.some((c) => (c.distance ?? 0) >= goalDistance);

	const rankingMetric = challenge.rankingMetric;

	// TODO: There are two loops here, there could be a single loop
	const rankingValueSeconds = selectFastestRanking(contributions, rankingMetric);
	const highlightedContribution = selectHighlightContribution(contributions, rankingMetric);

	return {
		metrics: {
			rankingValueSeconds,
			resultDistance: highlightedContribution?.distance ?? null,
			highlightActivityId: highlightedContribution?.stravaActivityId ?? null,
			resultMovingTimeSeconds: highlightedContribution?.movingTime ?? null,
			resultElapsedTimeSeconds: highlightedContribution?.elapsedTime ?? null
		},
		goalMet
	};
}

function selectFastestRanking(
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

// Recovers the ranking time when Strava's bestEfforts splits are missing but the
// activity's total distance is within FALLBACK_TOTAL_TOLERANCE_RATIO of the metric target
// (e.g. a 5050 m run for a STANDARD_5K challenge counts as a 5K attempt).
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

type HighlightContribution = {
	stravaActivityId: number;
	distance: number | null;
	movingTime: number | null;
	elapsedTime: number | null;
};

function selectHighlightContribution(
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

		// Tie-break on faster time for same distance, then lower activity id for determinism.
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
