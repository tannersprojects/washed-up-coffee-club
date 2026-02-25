import {
	CHALLENGE_STATUS,
	CHALLENGE_TYPE,
	PARTICIPANT_STATUS,
	type ParticipantStatus
} from '$lib/constants';
import { db } from '$lib/db';
import {
	challengeContributionsTable,
	challengeParticipantsTable,
	challengesTable,
	type Challenge,
	type ChallengeParticipant
} from '$lib/db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import type { StravaDetailedActivityCamel } from '$lib/types/strava';
import { validateActivityForChallenge, type ValidationResult } from './strava-activity-validators';

/** Process an activity for all active challenges the profile participates in */
export async function processActivityForChallenges(
	activity: StravaDetailedActivityCamel,
	profileId: string
): Promise<void> {
	const activityDate = new Date(activity.startDate);

	const participantChallengePairs = await db
		.select({
			participant: challengeParticipantsTable,
			challenge: challengesTable
		})
		.from(challengeParticipantsTable)
		.innerJoin(challengesTable, eq(challengeParticipantsTable.challengeId, challengesTable.id))
		.where(
			and(
				eq(challengeParticipantsTable.profileId, profileId),
				eq(challengesTable.isActive, true),
				eq(challengesTable.status, CHALLENGE_STATUS.ACTIVE),
				lte(challengesTable.startDate, activityDate),
				gte(challengesTable.endDate, activityDate)
			)
		);

	console.log(
		`Found ${participantChallengePairs.length} active challenges for profile ${profileId}`
	);

	for (const { participant, challenge } of participantChallengePairs) {
		console.log(`Validating activity ${activity.id} for challenge ${challenge.id}`);
		const validation = validateActivityForChallenge(activity, challenge);
		console.log(`Validation result: ${JSON.stringify(validation)}`);
		if (!validation.valid) continue;

		console.log(`Checking for existing contribution for activity ${activity.id}`);
		const existing = await db.query.challengeContributionsTable.findFirst({
			where: and(
				eq(challengeContributionsTable.participantId, participant.id),
				eq(challengeContributionsTable.stravaActivityId, activity.id)
			)
		});
		if (existing) continue;

		console.log(`Inserting contribution for activity ${activity.id}`);
		await db.insert(challengeContributionsTable).values({
			participantId: participant.id,
			stravaActivityId: activity.id,
			activityName: activity.name,
			distance: validation.distance,
			time: validation.time,
			occurredAt: activityDate
		});

		const nextState = computeNextParticipantState(participant, challenge, validation, activity.id);
		console.log(`Next participant state: ${JSON.stringify(nextState)}`);

		await db
			.update(challengeParticipantsTable)
			.set({
				...nextState,
				updatedAt: new Date()
			})
			.where(eq(challengeParticipantsTable.id, participant.id));
	}
}

type NextParticipantState = {
	resultDistance: number | null;
	resultTime: number | null;
	status: ParticipantStatus;
	highlightActivityId: number | null;
};

function computeNextParticipantState(
	participant: ChallengeParticipant,
	challenge: Challenge,
	validation: ValidationResult & { valid: true },
	activityId: number
): NextParticipantState {
	const goalDistance = challenge.goalDistance ?? 0;
	const challengeType = challenge.type;

	let resultDistance: number | null = participant.resultDistance ?? null;
	let resultTime: number | null = participant.resultTime ?? null;
	let status = participant.status ?? PARTICIPANT_STATUS.REGISTERED;
	let highlightActivityId = participant.highlightActivityId ?? null;

	if (challengeType === CHALLENGE_TYPE.BEST_EFFORT) {
		const newDistance = validation.distance;
		const currentDistance = participant.resultDistance ?? 0;
		if (newDistance > currentDistance) {
			resultDistance = newDistance;
			resultTime = validation.time;
			highlightActivityId = activityId;
		}
	} else if (challengeType === CHALLENGE_TYPE.CUMULATIVE) {
		resultDistance = (participant.resultDistance ?? 0) + validation.distance;
		resultTime = (participant.resultTime ?? 0) + validation.time;
		highlightActivityId = activityId;
	} else if (challengeType === CHALLENGE_TYPE.SEGMENT_RACE) {
		const newTime = validation.time;
		if (newTime != null) {
			const currentBest = participant.resultTime ?? Infinity;
			if (newTime < currentBest) {
				resultTime = newTime;
				highlightActivityId = activityId;
			}
		}
	}

	if (status === PARTICIPANT_STATUS.REGISTERED) {
		status = PARTICIPANT_STATUS.IN_PROGRESS;
	}
	if (isGoalMet(challengeType, resultDistance, resultTime, goalDistance, challenge.segmentId)) {
		status = PARTICIPANT_STATUS.COMPLETED;
	}

	return { resultDistance, resultTime, status, highlightActivityId };
}

function isGoalMet(
	challengeType: string,
	resultDistance: number | null,
	resultTime: number | null,
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
		return segmentId != null && (resultTime ?? 0) > 0;
	}
	return false;
}
