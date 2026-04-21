import {
	CHALLENGE_TYPE,
	PARTICIPANT_STATUS,
	type ChallengeType,
	type ParticipantStatus
} from '$lib/constants';
import type { Challenge, ChallengeContribution, ChallengeParticipant } from '$lib/db/schema';
import { computeMetricsForBestEffortChallenge } from './best-effort-state';
import { computeMetricsForCumulativeChallenge } from './cumulative-state';
import { computeMetricsForSegmentRaceChallenge } from './segment-race-state';

export type NextParticipantState = {
	resultDistance: number | null;
	resultMovingTimeSeconds: number | null;
	resultElapsedTimeSeconds: number | null;
	rankingValueSeconds: number | null;
	rankingComputedAt: Date;
	status: ParticipantStatus;
	highlightActivityId: number | null;
};

export type ParticipantContributionMetrics = Pick<
	NextParticipantState,
	| 'resultDistance'
	| 'resultMovingTimeSeconds'
	| 'resultElapsedTimeSeconds'
	| 'rankingValueSeconds'
	| 'highlightActivityId'
>;

export type ParticipantStateResult = {
	metrics: ParticipantContributionMetrics;
	goalMet: boolean;
};

type ChallengeParticipantStateStrategy = (
	participant: ChallengeParticipant,
	challenge: Challenge,
	activityId: number,
	contributions: ChallengeContribution[]
) => ParticipantStateResult;

const CHALLENGE_PARTICIPANT_STATE_STRATEGIES = {
	[CHALLENGE_TYPE.BEST_EFFORT]: handleBestEffortState,
	[CHALLENGE_TYPE.CUMULATIVE]: handleCumulativeState,
	[CHALLENGE_TYPE.SEGMENT_RACE]: handleSegmentRaceState
} satisfies Record<ChallengeType, ChallengeParticipantStateStrategy>;

export function computeNextParticipantState(
	participant: ChallengeParticipant,
	challenge: Challenge,
	activityId: number,
	contributions: ChallengeContribution[]
): NextParticipantState {
	const computeMetricsHandler = CHALLENGE_PARTICIPANT_STATE_STRATEGIES[challenge.type];

	const { metrics, goalMet } = computeMetricsHandler(
		participant,
		challenge,
		activityId,
		contributions
	);

	let status = participant.status ?? PARTICIPANT_STATUS.REGISTERED;
	if (status === PARTICIPANT_STATUS.REGISTERED) {
		status = PARTICIPANT_STATUS.IN_PROGRESS;
	}
	if (goalMet) {
		status = PARTICIPANT_STATUS.COMPLETED;
	}

	return {
		...metrics,
		rankingComputedAt: new Date(),
		status
	};
}

function handleBestEffortState(
	participant: ChallengeParticipant,
	challenge: Challenge,
	activityId: number,
	contributions: ChallengeContribution[]
): ParticipantStateResult {
	return computeMetricsForBestEffortChallenge(participant, challenge, activityId, contributions);
}

function handleCumulativeState(
	participant: ChallengeParticipant,
	challenge: Challenge,
	activityId: number,
	contributions: ChallengeContribution[]
): ParticipantStateResult {
	return computeMetricsForCumulativeChallenge(participant, challenge, activityId, contributions);
}

function handleSegmentRaceState(
	participant: ChallengeParticipant,
	challenge: Challenge,
	activityId: number,
	contributions: ChallengeContribution[]
): ParticipantStateResult {
	return computeMetricsForSegmentRaceChallenge(participant, challenge, activityId, contributions);
}
