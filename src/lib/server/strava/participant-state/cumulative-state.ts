import type { Challenge, ChallengeContribution, ChallengeParticipant } from '$lib/db/schema';
import { sumDistances, sumElapsedTimes, sumMovingTimes } from './ranking/shared-ranking';
import {
	computeCumulativeRankingValue,
	selectCumulativeHighlightActivityId
} from './ranking/cumulative-ranking';
import type { ParticipantStateResult } from './participant-state';

// TODO: This may not need to take in participant and activityId as parameters
export function computeMetricsForCumulativeChallenge(
	_participant: ChallengeParticipant,
	challenge: Challenge,
	_activityId: number,
	contributions: ChallengeContribution[]
): ParticipantStateResult {
	const rankingMetric = challenge.rankingMetric;
	const goalDistance = challenge.goalDistance ?? 0;
	const resultDistance = sumDistances(contributions);
	const goalMet = resultDistance >= goalDistance;

	const resultMovingTimeSeconds = sumMovingTimes(contributions);
	const resultElapsedTimeSeconds = sumElapsedTimes(contributions);
	const rankingValueSeconds = computeCumulativeRankingValue({
		contributions,
		rankingMetric,
		goalDistance
	});
	const highlightActivityId = selectCumulativeHighlightActivityId(contributions);

	return {
		metrics: {
			resultDistance,
			resultMovingTimeSeconds,
			resultElapsedTimeSeconds,
			rankingValueSeconds,
			highlightActivityId
		},
		goalMet
	};
}
