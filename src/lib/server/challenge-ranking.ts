import { RANKING_METRIC, RANKING_METRIC_DISTANCES, type RankingMetric } from '$lib/constants';
import { db } from '$lib/db';
import { challengeContributionsTable, challengeParticipantsTable } from '$lib/db/schema';
import type { ChallengeBestEffortsSnapshot } from '$lib/types/challenge-ranking';
import { eq } from 'drizzle-orm';

const DISTANCE_TOLERANCE_RATIO = 0.01;

type ContributionForRanking = {
	stravaActivityId: number;
	distance: number | null;
	movingTime: number | null;
	elapsedTime: number | null;
	bestEfforts: ChallengeBestEffortsSnapshot | null;
};

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
	contributions: ContributionForRanking[],
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

export function selectBestDistanceContribution(contributions: ContributionForRanking[]): {
	stravaActivityId: number | null;
	distance: number | null;
} {
	let bestActivityId: number | null = null;
	let bestDistance: number | null = null;
	let bestTime: number | null = null;

	for (const contribution of contributions) {
		const distance = contribution.distance ?? null;
		if (distance == null) continue;

		const isBetterDistance = bestDistance == null || distance > bestDistance;
		if (isBetterDistance) {
			bestDistance = distance;
			bestActivityId = contribution.stravaActivityId;
			bestTime = getPreferredTime(contribution.movingTime, contribution.elapsedTime);
			continue;
		}

		// Tie-break on faster time for same distance, then lower activity id for determinism.
		if (bestDistance != null && distance === bestDistance) {
			const candidateTime = getPreferredTime(contribution.movingTime, contribution.elapsedTime);
			if (
				(bestTime == null && candidateTime != null) ||
				(candidateTime != null && bestTime != null && candidateTime < bestTime) ||
				(candidateTime === bestTime &&
					bestActivityId != null &&
					contribution.stravaActivityId < bestActivityId)
			) {
				bestActivityId = contribution.stravaActivityId;
				bestTime = candidateTime;
			}
		}
	}

	return { stravaActivityId: bestActivityId, distance: bestDistance };
}

export async function recomputeParticipantRanking(
	participantId: string,
	challengeRankingMetric: RankingMetric
): Promise<number | null> {
	const contributions = await db.query.challengeContributionsTable.findMany({
		where: eq(challengeContributionsTable.participantId, participantId)
	});

	const rankingValueSeconds = computeRankingValueFromContributions(
		contributions,
		challengeRankingMetric
	);

	await db
		.update(challengeParticipantsTable)
		.set({
			rankingValueSeconds,
			rankingComputedAt: new Date(),
			updatedAt: new Date()
		})
		.where(eq(challengeParticipantsTable.id, participantId));

	return rankingValueSeconds;
}

function getPreferredTime(
	movingTime: number | null | undefined,
	elapsedTime: number | null | undefined
) {
	if (movingTime != null && movingTime > 0) return movingTime;
	if (elapsedTime != null && elapsedTime > 0) return elapsedTime;
	return null;
}
