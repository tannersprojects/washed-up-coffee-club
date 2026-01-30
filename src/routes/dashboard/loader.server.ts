import { db } from '$lib/db';
import { challengeParticipantsTable, challengesTable } from '$lib/db/schema';
import { asc, desc, eq, and, inArray } from 'drizzle-orm';
import type { ChallengeWithParticipation, LeaderboardRow } from '$lib/types/dashboard.js';
import type { ChallengeParticipantWithRelations } from '$lib/types/dashboard.js';
import { PARTICIPANT_STATUS } from '$lib/constants';

// Challenge Queries

export async function loadChallenge(challengeId: string) {
	return await db.query.challengesTable.findFirst({
		where: eq(challengesTable.id, challengeId)
	});
}

export async function loadActiveChallenges() {
	return await db.query.challengesTable.findMany({
		where: eq(challengesTable.isActive, true)
	});
}

export async function joinChallenge(challengeId: string, profileId: string) {
	const result = await db
		.insert(challengeParticipantsTable)
		.values({
			challengeId: challengeId,
			profileId: profileId,
			status: PARTICIPANT_STATUS.REGISTERED
		})
		.returning({
			id: challengeParticipantsTable.id
		});

	return result[0];
}

export async function leaveChallenge(challengeParticipantId: string) {
	await db
		.delete(challengeParticipantsTable)
		.where(eq(challengeParticipantsTable.id, challengeParticipantId));
}

// Challenge Participant Queries

export async function loadChallengeParticipantWithRelations(challengeParticipantId: string) {
	return await db.query.challengeParticipantsTable.findFirst({
		where: eq(challengeParticipantsTable.id, challengeParticipantId),
		with: {
			profile: true,
			contributions: true
		}
	});
}

export async function loadChallengeParticipants(
	challengeId: string
): Promise<ChallengeParticipantWithRelations[]> {
	return await db.query.challengeParticipantsTable.findMany({
		where: eq(challengeParticipantsTable.challengeId, challengeId),
		with: {
			profile: true,
			contributions: true
		},
		orderBy: [desc(challengeParticipantsTable.status), asc(challengeParticipantsTable.resultValue)]
	});
}

export async function checkUserParticipation(
	challengeId: string,
	profileId: string
): Promise<ChallengeParticipantWithRelations | null> {
	const participant = await db.query.challengeParticipantsTable.findFirst({
		where: and(
			eq(challengeParticipantsTable.challengeId, challengeId),
			eq(challengeParticipantsTable.profileId, profileId)
		),
		with: {
			profile: true,
			contributions: true
		}
	});
	return participant ?? null;
}

/**
 * Build leaderboard from challenge participants
 * Transforms participant data into LeaderboardRow format with ranking
 */
export function buildLeaderboard(
	challengeParticipants: ChallengeParticipantWithRelations[]
): LeaderboardRow[] {
	let currentRank = 1;
	const leaderboard = challengeParticipants.map((participant) => {
		const isFinished = participant.status === 'completed';

		return {
			participant,
			profile: participant.profile,
			// We grab the first contribution to display the activity name (e.g. "Morning Run")
			contribution: participant.contributions?.[0] || null,
			rank: isFinished ? currentRank++ : null
		};
	});

	return leaderboard;
}

export async function loadDashboardData(profileId: string) {
	const challengeParticipantsWithRelationsByChallenge: Record<
		string,
		ChallengeParticipantWithRelations[]
	> = {};
	const challengesWithParticipation: ChallengeWithParticipation[] = [];

	const challenges = await loadActiveChallenges();
	if (challenges.length === 0) {
		return { challengesWithParticipation, challengeParticipantsWithRelationsByChallenge };
	}

	const challengeIds = challenges.map((c) => c.id);
	const allParticipants = await db.query.challengeParticipantsTable.findMany({
		where: inArray(challengeParticipantsTable.challengeId, challengeIds),
		with: {
			profile: true,
			contributions: true
		},
		orderBy: [desc(challengeParticipantsTable.status), asc(challengeParticipantsTable.resultValue)]
	});

	for (const participant of allParticipants) {
		const challengeId = participant.challengeId;
		if (!challengeParticipantsWithRelationsByChallenge[challengeId]) {
			challengeParticipantsWithRelationsByChallenge[challengeId] = [];
		}
		challengeParticipantsWithRelationsByChallenge[challengeId]!.push(participant);
	}

	for (const challenge of challenges) {
		const challengeParticipants = challengeParticipantsWithRelationsByChallenge[challenge.id] || [];
		const userParticipant = challengeParticipants.find((p) => p.profileId === profileId);

		challengesWithParticipation.push({
			...challenge,
			isParticipating: userParticipant !== undefined,
			participant: userParticipant || null
		});
	}

	return {
		challengesWithParticipation,
		challengeParticipantsWithRelationsByChallenge
	};
}
