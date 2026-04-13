import {
	CHALLENGE_STATUS,
	RANKING_METRIC,
	CHALLENGE_TYPE,
	PARTICIPANT_STATUS,
	type ParticipantStatus,
	type RankingMetric
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
import { validateActivityForChallenge } from './strava-activity-validators';
import {
	computeRankingValueFromContributions,
	recomputeParticipantRanking,
	selectBestDistanceContribution
} from './challenge-ranking';
import type { ChallengeBestEffortsSnapshot } from '$lib/types/challenge-ranking';

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
			movingTime: validation.movingTime,
			elapsedTime: validation.elapsedTime,
			bestEfforts: validation.bestEfforts,
			splitsMetric: validation.splitsMetric,
			splitsStandard: validation.splitsStandard,
			laps: validation.laps,
			activitySnapshot: validation.activitySnapshot,
			occurredAt: activityDate
		});

		const participantContributions = await db.query.challengeContributionsTable.findMany({
			where: eq(challengeContributionsTable.participantId, participant.id)
		});

		const nextState = computeNextParticipantState(
			participant,
			challenge,
			activity.id,
			participantContributions
		);
		console.log(`Next participant state: ${JSON.stringify(nextState)}`);

		await db
			.update(challengeParticipantsTable)
			.set({
				...nextState,
				updatedAt: new Date()
			})
			.where(eq(challengeParticipantsTable.id, participant.id));

		if (challenge.type !== CHALLENGE_TYPE.SEGMENT_RACE) {
			await recomputeParticipantRanking(participant.id, challenge.rankingMetric);
		}
	}
}

type NextParticipantState = {
	resultDistance: number | null;
	resultMovingTimeTotal: number | null;
	rankingValueSeconds: number | null;
	rankingComputedAt: Date;
	status: ParticipantStatus;
	highlightActivityId: number | null;
};

function computeNextParticipantState(
	participant: ChallengeParticipant,
	challenge: Challenge,
	activityId: number,
	contributions: Array<{
		stravaActivityId: number;
		distance: number | null;
		movingTime: number | null;
		elapsedTime: number | null;
		bestEfforts: ChallengeBestEffortsSnapshot | null;
	}>
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

function isGoalMet(
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

function sumDistances(
	contributions: Array<{
		distance: number | null;
	}>
): number {
	return contributions.reduce((acc, contribution) => acc + (contribution.distance ?? 0), 0);
}

function sumMovingTimes(
	contributions: Array<{
		movingTime: number | null;
	}>
): number {
	return contributions.reduce((acc, contribution) => acc + (contribution.movingTime ?? 0), 0);
}

function getFastestContribution(
	contributions: Array<{
		stravaActivityId: number;
		distance: number | null;
		movingTime: number | null;
		elapsedTime: number | null;
	}>
): { stravaActivityId: number; distance: number | null; movingTime: number } | null {
	let best: { stravaActivityId: number; distance: number | null; movingTime: number } | null = null;
	for (const contribution of contributions) {
		const movingTime = contribution.movingTime ?? contribution.elapsedTime ?? null;
		if (movingTime == null || movingTime <= 0) continue;
		if (best == null || movingTime < best.movingTime) {
			best = {
				stravaActivityId: contribution.stravaActivityId,
				distance: contribution.distance,
				movingTime
			};
		}
	}
	return best;
}

function getBestEffortHighlightContribution(
	contributions: Array<{
		stravaActivityId: number;
		distance: number | null;
		movingTime: number | null;
		elapsedTime: number | null;
		bestEfforts: ChallengeBestEffortsSnapshot | null;
	}>,
	rankingMetric: RankingMetric
): { stravaActivityId: number; distance: number | null } | null {
	if (rankingMetric === RANKING_METRIC.NONE) {
		const bestDistance = selectBestDistanceContribution(contributions);
		if (bestDistance.stravaActivityId == null) return null;
		return { stravaActivityId: bestDistance.stravaActivityId, distance: bestDistance.distance };
	}

	let best: {
		stravaActivityId: number;
		distance: number | null;
		rankingValueSeconds: number;
	} | null = null;
	for (const contribution of contributions) {
		const rankingValueSeconds = computeRankingValueFromContributions([contribution], rankingMetric);
		if (rankingValueSeconds == null) continue;
		if (
			best == null ||
			rankingValueSeconds < best.rankingValueSeconds ||
			(rankingValueSeconds === best.rankingValueSeconds &&
				contribution.stravaActivityId < best.stravaActivityId)
		) {
			best = {
				stravaActivityId: contribution.stravaActivityId,
				distance: contribution.distance,
				rankingValueSeconds
			};
		}
	}

	if (!best) return null;
	return { stravaActivityId: best.stravaActivityId, distance: best.distance };
}
