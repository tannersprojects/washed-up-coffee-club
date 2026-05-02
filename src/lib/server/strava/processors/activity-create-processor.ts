import { CHALLENGE_STATUS } from '$lib/constants';
import { db } from '$lib/db';
import {
	challengeContributionsTable,
	challengeParticipantsTable,
	challengesTable,
	type Challenge,
	type ChallengeParticipant
} from '$lib/db/schema';
import { LoggingEvents } from '$lib/server/logging/events';
import { logger } from '$lib/server/logging/logger';
import type { WebhookCorrelation } from '$lib/server/strava/webhook-correlation';
import { and, eq, gte, lte } from 'drizzle-orm';
import type { Logger } from 'pino';
import type { StravaDetailedActivityCamel } from '$lib/types/strava';
import {
	validateActivityForChallenge,
	type ValidationResult
} from '../validators/activity-validator';
import {
	computeNextParticipantState,
	type NextParticipantState
} from '../participant-state/participant-state';

type ParticipantChallengePair = {
	participant: ChallengeParticipant;
	challenge: Challenge;
};

type ValidatedContribution = Extract<ValidationResult, { valid: true }>;

function createActivityLogger(
	profileId: string,
	activityId: number,
	correlation: WebhookCorrelation | undefined,
	parentLogger?: Logger
): Logger {
	const base = parentLogger ?? logger;
	return base.child({
		profileId,
		activityId,
		...(correlation?.webhookLogId != null && { webhookLogId: correlation.webhookLogId })
	});
}

/** Process a newly created Strava activity against all active challenges the profile participates in */
export async function processCreateActivity(
	activity: StravaDetailedActivityCamel,
	profileId: string,
	correlation?: WebhookCorrelation,
	parentLogger?: Logger
): Promise<void> {
	const log = createActivityLogger(profileId, activity.id, correlation, parentLogger);

	const activityDate = new Date(activity.startDate);

	const participantChallengePairs = await findActiveParticipantChallengesForProfileOnDate(
		profileId,
		activityDate
	);

	const eligibleChallengeCount = participantChallengePairs.length;

	let contributionsInserted = 0;
	let contributionsDuplicate = 0;
	let challengesSkippedValidation = 0;
	let participantStateUpdates = 0;

	for (const { participant, challenge } of participantChallengePairs) {
		const validation = validateActivityForChallenge(activity, challenge);

		if (!validation.valid) {
			challengesSkippedValidation++;
			log.debug(
				{
					event: LoggingEvents.STRAVA_ACTIVITY_CHALLENGE_SKIPPED,
					challengeId: challenge.id,
					challengeType: challenge.type,
					participantId: participant.id
				},
				'challenge validation skipped'
			);
			continue;
		}

		log.debug(
			{
				event: LoggingEvents.STRAVA_ACTIVITY_CHALLENGE_VALIDATED,
				challengeId: challenge.id,
				challengeType: challenge.type,
				participantId: participant.id,
				distance: validation.distance
			},
			'challenge validated'
		);

		const inserted = await insertChallengeContribution(
			participant.id,
			activity,
			validation,
			activityDate
		);

		if (!inserted) {
			contributionsDuplicate++;
			log.debug(
				{
					event: LoggingEvents.STRAVA_ACTIVITY_CHALLENGE_DUPLICATE,
					challengeId: challenge.id,
					participantId: participant.id,
					activityId: activity.id
				},
				'duplicate contribution'
			);
			continue;
		}

		contributionsInserted++;
		log.debug(
			{
				event: LoggingEvents.STRAVA_ACTIVITY_CHALLENGE_CONTRIBUTION_INSERTED,
				challengeId: challenge.id,
				participantId: participant.id,
				activityId: activity.id
			},
			'contribution inserted'
		);

		const participantContributions = await findContributionsForParticipant(participant.id);

		const nextState = computeNextParticipantState(
			participant,
			challenge,
			activity.id,
			participantContributions
		);

		await updateChallengeParticipantAggregates(participant.id, nextState);
		participantStateUpdates++;

		log.info(
			{
				event: LoggingEvents.STRAVA_ACTIVITY_PARTICIPANT_STATE_UPDATED,
				profileId,
				challengeId: challenge.id,
				participantId: participant.id,
				activityId: activity.id,
				resultDistance: nextState.resultDistance,
				rankingValueSeconds: nextState.rankingValueSeconds,
				resultMovingTimeSeconds: nextState.resultMovingTimeSeconds,
				resultElapsedTimeSeconds: nextState.resultElapsedTimeSeconds,
				status: nextState.status,
				highlightActivityId: nextState.highlightActivityId
			},
			'participant state updated'
		);
	}

	log.info(
		{
			event: LoggingEvents.STRAVA_ACTIVITY_CREATE_SUMMARY,
			profileId,
			activityId: activity.id,
			eligibleChallengeCount,
			contributionsInserted,
			contributionsDuplicate,
			challengesSkippedValidation,
			participantStateUpdates,
			...(correlation?.webhookLogId != null && { webhookLogId: correlation.webhookLogId })
		},
		'activity create summary'
	);
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

async function insertChallengeContribution(
	participantId: string,
	activity: StravaDetailedActivityCamel,
	validation: ValidatedContribution,
	occurredAt: Date
): Promise<boolean> {
	const [inserted] = await db
		.insert(challengeContributionsTable)
		.values({
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
		})
		.onConflictDoNothing({
			target: [
				challengeContributionsTable.participantId,
				challengeContributionsTable.stravaActivityId
			]
		})
		.returning({ id: challengeContributionsTable.id });

	return Boolean(inserted);
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
