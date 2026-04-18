import type { Challenge, ChallengeContribution, ChallengeParticipant } from '$lib/db/schema';
import {
	computeRankingValueFromContributions,
	getBestEffortHighlightContribution
} from '../challenge-ranking';
import type { ParticipantStateResult } from './participant-state';

export function computeMetricsForBestEffortChallenge(
	_participant: ChallengeParticipant,
	challenge: Challenge,
	_activityId: number,
	contributions: ChallengeContribution[]
): ParticipantStateResult {
	const goalDistance = challenge.goalDistance ?? 0;
	const goalMet = contributions.some((c) => (c.distance ?? 0) >= goalDistance);

	const rankingMetric = challenge.rankingMetric;
	const rankingValueSeconds = computeRankingValueFromContributions(contributions, rankingMetric);
	const highlightedContribution = getBestEffortHighlightContribution(contributions, rankingMetric);

	return {
		metrics: {
			rankingValueSeconds,
			resultDistance: highlightedContribution?.distance ?? null,
			highlightActivityId: highlightedContribution?.stravaActivityId ?? null,
			resultMovingTimeTotal: null
		},
		goalMet
	};
}
