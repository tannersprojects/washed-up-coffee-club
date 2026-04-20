import type { Challenge, ChallengeContribution, ChallengeParticipant } from '$lib/db/schema';
import {
	computeRankingValueFromContributions,
	sumDistances,
	sumElapsedTimes,
	sumMovingTimes
} from '../challenge-ranking';
import type { ParticipantStateResult } from './participant-state';

export function computeMetricsForCumulativeChallenge(
	_participant: ChallengeParticipant,
	challenge: Challenge,
	activityId: number,
	contributions: ChallengeContribution[]
): ParticipantStateResult {
	const goalDistance = challenge.goalDistance ?? 0;
	const totalDistance = sumDistances(contributions);
	const goalMet = totalDistance >= goalDistance;

	return {
		metrics: {
			resultDistance: totalDistance,
			resultMovingTimeSeconds: sumMovingTimes(contributions),
			resultElapsedTimeSeconds: sumElapsedTimes(contributions),
			rankingValueSeconds: computeRankingValueFromContributions(
				contributions,
				challenge.rankingMetric
			),
			highlightActivityId: activityId
		},
		goalMet
	};
}
