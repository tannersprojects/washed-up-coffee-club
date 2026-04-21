import { db } from '$lib/db';
import { challengeParticipantsTable, challengesTable } from '$lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type {
	DashboardChallenge,
	ChallengeParticipantWithRelations
} from '$lib/types/dashboard.js';
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
		}
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

export async function loadDashboardData(): Promise<DashboardChallenge[]> {
	const challenges = await loadActiveChallenges();
	if (challenges.length === 0) return [];

	const challengeIds = challenges.map((c) => c.id);
	const allParticipants = await db.query.challengeParticipantsTable.findMany({
		where: inArray(challengeParticipantsTable.challengeId, challengeIds),
		with: {
			profile: true,
			contributions: true
		}
	});

	const participantsByChallengeId = new Map<string, ChallengeParticipantWithRelations[]>();
	for (const p of allParticipants) {
		const arr = participantsByChallengeId.get(p.challengeId) ?? [];
		arr.push(p);
		participantsByChallengeId.set(p.challengeId, arr);
	}

	return challenges.map((challenge) => ({
		...challenge,
		participants: participantsByChallengeId.get(challenge.id) ?? []
	}));
}
