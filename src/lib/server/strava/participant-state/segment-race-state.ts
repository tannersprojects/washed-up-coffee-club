// TODO(segment-race): Not functional yet. Returns the cached participant row unchanged
// and goalMet=false until segment metric computation is implemented.

import type { Challenge, ChallengeContribution, ChallengeParticipant } from '$lib/db/schema';
import type { ParticipantStateResult } from './participant-state';

export function computeMetricsForSegmentRaceChallenge(
	participant: ChallengeParticipant,
	_challenge: Challenge,
	_activityId: number,
	_contributions: ChallengeContribution[]
): ParticipantStateResult {
	// TODO: Segment race participant metrics not supported — preserve cached row until implemented.
	// Previous implementation (disabled):
	// const bestSegmentContribution = getFastestContribution(contributions);
	// rankingValueSeconds = bestSegmentContribution?.movingTime ?? null;
	// resultDistance = bestSegmentContribution?.distance ?? null;
	// highlightActivityId = bestSegmentContribution?.stravaActivityId ?? null;
	// resultMovingTimeSeconds = bestSegmentContribution?.movingTime ?? null;
	// resultElapsedTimeSeconds = bestSegmentContribution?.elapsedTime ?? null;
	// goalMet = challenge.segmentId != null && (rankingValueSeconds ?? 0) > 0;

	return {
		metrics: {
			resultDistance: participant.resultDistance ?? null,
			resultMovingTimeSeconds: participant.resultMovingTimeSeconds ?? null,
			resultElapsedTimeSeconds: participant.resultElapsedTimeSeconds ?? null,
			rankingValueSeconds: participant.rankingValueSeconds ?? null,
			highlightActivityId: participant.highlightActivityId ?? null
		},
		goalMet: false
	};
}
