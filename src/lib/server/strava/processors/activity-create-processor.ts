import { CHALLENGE_STATUS } from '$lib/constants';
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
import { validateActivityForChallenge, type ValidationResult } from '../activity-validators';
import { computeNextParticipantState, type NextParticipantState } from '../participant-state';

type ParticipantChallengePair = {
	participant: ChallengeParticipant;
	challenge: Challenge;
};

type ValidatedContribution = Extract<ValidationResult, { valid: true }>;

/** Process a newly created Strava activity against all active challenges the profile participates in */
export async function processCreateActivity(
	activity: StravaDetailedActivityCamel,
	profileId: string
): Promise<void> {
	const activityDate = new Date(activity.startDate);

	const participantChallengePairs = await findActiveParticipantChallengesForProfileOnDate(
		profileId,
		activityDate
	);

	console.log(
		`Found ${participantChallengePairs.length} active challenges for profile ${profileId}`
	);

	for (const { participant, challenge } of participantChallengePairs) {
		console.log(`Validating activity ${activity.id} for challenge ${challenge.id}`);
		const validation = validateActivityForChallenge(activity, challenge);

		console.log(`Validation result: ${JSON.stringify(validation)}`);
		if (!validation.valid) {
			continue;
		}

		const existingContribution = await findContributionForParticipantAndActivity(
			participant.id,
			activity.id
		);
		if (existingContribution) {
			console.log(`Existing contribution found for activity ${activity.id}`);
			continue;
		}

		console.log(`Inserting contribution for activity ${activity.id}`);
		await insertChallengeContribution(participant.id, activity, validation, activityDate);

		const participantContributions = await findContributionsForParticipant(participant.id);

		const nextState = computeNextParticipantState(
			participant,
			challenge,
			activity.id,
			participantContributions
		);
		console.log(`Next participant state: ${JSON.stringify(nextState)}`);

		await updateChallengeParticipantAggregates(participant.id, nextState);
	}
}

async function findActiveParticipantChallengesForProfileOnDate(
	profileId: string,
	activityDate: Date
): Promise<ParticipantChallengePair[]> {
	return db
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
}

async function findContributionForParticipantAndActivity(
	participantId: string,
	stravaActivityId: number
) {
	return db.query.challengeContributionsTable.findFirst({
		where: and(
			eq(challengeContributionsTable.participantId, participantId),
			eq(challengeContributionsTable.stravaActivityId, stravaActivityId)
		)
	});
}

async function insertChallengeContribution(
	participantId: string,
	activity: StravaDetailedActivityCamel,
	validation: ValidatedContribution,
	occurredAt: Date
): Promise<void> {
	await db.insert(challengeContributionsTable).values({
		participantId,
		stravaActivityId: activity.id,
		activityName: activity.name,
		distance: validation.distance,
		movingTime: validation.movingTime,
		elapsedTime: validation.elapsedTime,
		bestEfforts: validation.bestEfforts,
		splitsMetric: validation.splitsMetric,
		splitsStandard: validation.splitsStandard,
		laps: validation.laps,
		activitySnapshot: validation.activitySnapshot,
		occurredAt
	});
}

async function findContributionsForParticipant(participantId: string) {
	return db.query.challengeContributionsTable.findMany({
		where: eq(challengeContributionsTable.participantId, participantId)
	});
}

async function updateChallengeParticipantAggregates(
	participantId: string,
	nextState: NextParticipantState
): Promise<void> {
	await db
		.update(challengeParticipantsTable)
		.set({ ...nextState, updatedAt: new Date() })
		.where(eq(challengeParticipantsTable.id, participantId));
}
