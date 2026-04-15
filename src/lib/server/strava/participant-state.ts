import { CHALLENGE_TYPE, PARTICIPANT_STATUS, type ParticipantStatus } from '$lib/constants';
import type { Challenge, ChallengeParticipant } from '$lib/db/schema';
import type { ChallengeBestEffortsSnapshot } from '$lib/types/challenge-ranking';
import {
	computeRankingValueFromContributions,
	getBestEffortHighlightContribution,
	sumDistances,
	sumMovingTimes,
	getFastestContribution
} from './challenge-ranking';

export type NextParticipantState = {
	resultDistance: number | null;
	resultMovingTimeTotal: number | null;
	rankingValueSeconds: number | null;
	rankingComputedAt: Date;
	status: ParticipantStatus;
	highlightActivityId: number | null;
};

type ContributionForState = {
	stravaActivityId: number;
	distance: number | null;
	movingTime: number | null;
	elapsedTime: number | null;
	bestEfforts: ChallengeBestEffortsSnapshot | null;
};

export function computeNextParticipantState(
	participant: ChallengeParticipant,
	challenge: Challenge,
	activityId: number,
	contributions: ContributionForState[]
): NextParticipantState {
	const goalDistance = challenge.goalDistance ?? 0;
	const challengeType = challenge.type;
	const rankingMetric = challenge.rankingMetric;

	let resultDistance: number | null = participant.resultDistance ?? null;
	let resultMovingTimeTotal: number | null = participant.resultMovingTimeTotal ?? null;
	let rankingValueSeconds: number | null = participant.rankingValueSeconds ?? null;
	let status = participant.status ?? PARTICIPANT_STATUS.REGISTERED;
	let highlightActivityId = participant.highlightActivityId ?? null;

	if (challengeType === CHALLENGE_TYPE.BEST_EFFORT) {
		rankingValueSeconds = computeRankingValueFromContributions(contributions, rankingMetric);
		const highlightedContribution = getBestEffortHighlightContribution(
			contributions,
			rankingMetric
		);
		resultDistance = highlightedContribution?.distance ?? null;
		highlightActivityId = highlightedContribution?.stravaActivityId ?? null;
		resultMovingTimeTotal = null;
	} else if (challengeType === CHALLENGE_TYPE.CUMULATIVE) {
		resultDistance = sumDistances(contributions);
		resultMovingTimeTotal = sumMovingTimes(contributions);
		rankingValueSeconds = computeRankingValueFromContributions(contributions, rankingMetric);
		highlightActivityId = activityId;
	} else if (challengeType === CHALLENGE_TYPE.SEGMENT_RACE) {
		const bestSegmentContribution = getFastestContribution(contributions);
		rankingValueSeconds = bestSegmentContribution?.movingTime ?? null;
		resultDistance = bestSegmentContribution?.distance ?? null;
		highlightActivityId = bestSegmentContribution?.stravaActivityId ?? null;
		resultMovingTimeTotal = null;
	}

	if (status === PARTICIPANT_STATUS.REGISTERED) {
		status = PARTICIPANT_STATUS.IN_PROGRESS;
	}
	if (
		isGoalMet(challengeType, resultDistance, rankingValueSeconds, goalDistance, challenge.segmentId)
	) {
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

export function isGoalMet(
	challengeType: string,
	resultDistance: number | null,
	rankingValueSeconds: number | null,
	goalDistance: number,
	segmentId: number | null
): boolean {
	if (challengeType === CHALLENGE_TYPE.BEST_EFFORT) {
		return (resultDistance ?? 0) >= goalDistance;
	}
	if (challengeType === CHALLENGE_TYPE.CUMULATIVE) {
		return (resultDistance ?? 0) >= goalDistance;
	}
	if (challengeType === CHALLENGE_TYPE.SEGMENT_RACE) {
		return segmentId != null && (rankingValueSeconds ?? 0) > 0;
	}
	return false;
}
