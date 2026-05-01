import type { Challenge, ChallengeContribution, ChallengeParticipant } from '$lib/db/schema';
import {
	computeBestEffortRankingValue,
	selectBestEffortHighlightContribution
} from './ranking/best-effort-ranking';
import type { ParticipantStateResult } from './participant-state';

// TODO: This may not need to take in participant and activityId as parameters
export function computeMetricsForBestEffortChallenge(
	_participant: ChallengeParticipant,
	challenge: Challenge,
	_activityId: number,
	contributions: ChallengeContribution[]
): ParticipantStateResult {
	const goalDistance = challenge.goalDistance ?? 0;
	const goalMet = contributions.some((c) => (c.distance ?? 0) >= goalDistance);

	const rankingMetric = challenge.rankingMetric;

	// TODO: This loop executes twice, there could be a single loop
	const rankingValueSeconds = computeBestEffortRankingValue(contributions, rankingMetric);
	const highlightedContribution = selectBestEffortHighlightContribution(
		contributions,
		rankingMetric
	);

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
