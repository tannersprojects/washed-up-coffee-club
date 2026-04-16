import {
	CHALLENGE_TYPE,
	PARTICIPANT_STATUS,
	type ChallengeType,
	type ParticipantStatus
} from '$lib/constants';
import type { Challenge, ChallengeContribution, ChallengeParticipant } from '$lib/db/schema';
import {
	computeRankingValueFromContributions,
	getBestEffortHighlightContribution,
	sumDistances,
	sumMovingTimes
} from './challenge-ranking';

export type NextParticipantState = {
	resultDistance: number | null;
	resultMovingTimeTotal: number | null;
	rankingValueSeconds: number | null;
	rankingComputedAt: Date;
	status: ParticipantStatus;
	highlightActivityId: number | null;
};

type ParticipantContributionMetrics = Pick<
	NextParticipantState,
	'resultDistance' | 'resultMovingTimeTotal' | 'rankingValueSeconds' | 'highlightActivityId'
>;

type ChallengeParticipantStateStrategy = (
	participant: ChallengeParticipant,
	challenge: Challenge,
	activityId: number,
	contributions: ChallengeContribution[]
) => ParticipantContributionMetrics;

const CHALLENGE_PARTICIPANT_STATE_STRATEGIES = {
	[CHALLENGE_TYPE.BEST_EFFORT]: computeMetricsForBestEffortChallenge,
	[CHALLENGE_TYPE.CUMULATIVE]: computeMetricsForCumulativeChallenge,
	[CHALLENGE_TYPE.SEGMENT_RACE]: computeMetricsForSegmentRaceChallenge
} satisfies Record<ChallengeType, ChallengeParticipantStateStrategy>;

export function computeNextParticipantState(
	participant: ChallengeParticipant,
	challenge: Challenge,
	activityId: number,
	contributions: ChallengeContribution[]
): NextParticipantState {
	const goalDistance = challenge.goalDistance ?? 0;
	const challengeType = challenge.type;

	let status = participant.status ?? PARTICIPANT_STATUS.REGISTERED;
	const computeMetrics = CHALLENGE_PARTICIPANT_STATE_STRATEGIES[challenge.type];

	const { resultDistance, resultMovingTimeTotal, rankingValueSeconds, highlightActivityId } =
		computeMetrics(participant, challenge, activityId, contributions);

	if (status === PARTICIPANT_STATUS.REGISTERED) {
		status = PARTICIPANT_STATUS.IN_PROGRESS;
	}

	if (isGoalMet(challengeType, resultDistance, goalDistance)) {
		status = PARTICIPANT_STATUS.COMPLETED;
	}

	return {
		resultDistance,
		resultMovingTimeTotal,
		rankingValueSeconds,
		rankingComputedAt: new Date(),
		status,
		highlightActivityId
	};
}

function computeMetricsForBestEffortChallenge(
	_participant: ChallengeParticipant,
	challenge: Challenge,
	_activityId: number,
	contributions: ChallengeContribution[]
): ParticipantContributionMetrics {
	const rankingMetric = challenge.rankingMetric;
	const rankingValueSeconds = computeRankingValueFromContributions(contributions, rankingMetric);
	const highlightedContribution = getBestEffortHighlightContribution(contributions, rankingMetric);

	return {
		rankingValueSeconds,
		resultDistance: highlightedContribution?.distance ?? null,
		highlightActivityId: highlightedContribution?.stravaActivityId ?? null,
		resultMovingTimeTotal: null
	};
}

function computeMetricsForCumulativeChallenge(
	_participant: ChallengeParticipant,
	challenge: Challenge,
	activityId: number,
	contributions: ChallengeContribution[]
): ParticipantContributionMetrics {
	const rankingMetric = challenge.rankingMetric;

	return {
		resultDistance: sumDistances(contributions),
		resultMovingTimeTotal: sumMovingTimes(contributions),
		rankingValueSeconds: computeRankingValueFromContributions(contributions, rankingMetric),
		highlightActivityId: activityId
	};
}

function computeMetricsForSegmentRaceChallenge(
	participant: ChallengeParticipant,
	_challenge: Challenge,
	_activityId: number,
	_contributions: ChallengeContribution[]
): ParticipantContributionMetrics {
	// TODO: Segment race participant metrics not supported — preserve cached row until implemented.
	// Previous implementation (disabled):
	// const bestSegmentContribution = getFastestContribution(contributions);
	// rankingValueSeconds = bestSegmentContribution?.movingTime ?? null;
	// resultDistance = bestSegmentContribution?.distance ?? null;
	// highlightActivityId = bestSegmentContribution?.stravaActivityId ?? null;
	// resultMovingTimeTotal = null;

	return {
		resultDistance: participant.resultDistance ?? null,
		resultMovingTimeTotal: participant.resultMovingTimeTotal ?? null,
		rankingValueSeconds: participant.rankingValueSeconds ?? null,
		highlightActivityId: participant.highlightActivityId ?? null
	};
}

function isGoalMet(
	challengeType: string,
	resultDistance: number | null,
	goalDistance: number
): boolean {
	if (challengeType === CHALLENGE_TYPE.BEST_EFFORT) {
		return (resultDistance ?? 0) >= goalDistance;
	}
	if (challengeType === CHALLENGE_TYPE.CUMULATIVE) {
		return (resultDistance ?? 0) >= goalDistance;
	}
	if (challengeType === CHALLENGE_TYPE.SEGMENT_RACE) {
		// TODO: Segment race goal completion not supported.
		// return segmentId != null && (rankingValueSeconds ?? 0) > 0;
		return false;
	}
	return false;
}
