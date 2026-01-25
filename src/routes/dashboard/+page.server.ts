import { db } from '$lib/db';
import { challengeParticipantsTable, challengesTable } from '$lib/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import type { ChallengeWithParticipation } from '$lib/types/dashboard.js';
import { isChallengeJoinable } from '$lib/utils/challenge-utils.js';
import { PARTICIPANT_STATUS } from '$lib/constants/participant_status.js';

export const load = async ({ locals }: { locals: App.Locals }) => {
	const { session, user } = await locals.safeGetSession();
	const profile = locals.profile;

	if (!session || !user || !profile) {
		throw redirect(302, '/');
	}

	// Load all active challenges with participation status
	const challenges = await loadActiveChallenges(profile.id);

	// Load leaderboards for all challenges
	const leaderboards: Record<string, Awaited<ReturnType<typeof buildLeaderboard>>> = {};
	for (const challenge of challenges) {
		const participants = await loadChallengeParticipants(challenge.id);
		leaderboards[challenge.id] = buildLeaderboard(participants);
	}

	return {
		user,
		profile,
		challenges,
		leaderboards
	};
};

async function checkUserParticipation(challengeId: string, profileId: string) {
	const participant = await db.query.challengeParticipantsTable.findFirst({
		where: and(
			eq(challengeParticipantsTable.challengeId, challengeId),
			eq(challengeParticipantsTable.profileId, profileId)
		)
	});

	return participant || null;
}

async function loadActiveChallenges(profileId: string): Promise<ChallengeWithParticipation[]> {
	const challenges = await db.query.challengesTable.findMany({
		where: eq(challengesTable.isActive, true)
	});

	// Attach participation status to each challenge
	return Promise.all(
		challenges.map(async (challenge) => {
			const participant = await checkUserParticipation(challenge.id, profileId);
			return {
				...challenge,
				isParticipating: participant !== null,
				participant: participant
			};
		})
	);
}

async function loadChallengeParticipants(challengeId: string) {
	const challengeParticipants = await db.query.challengeParticipantsTable.findMany({
		where: eq(challengeParticipantsTable.challengeId, challengeId),
		with: {
			profile: true,
			contributions: true
		},
		orderBy: [desc(challengeParticipantsTable.status), asc(challengeParticipantsTable.resultValue)]
	});

	return challengeParticipants;
}

function buildLeaderboard(
	challengeParticipants: Awaited<ReturnType<typeof loadChallengeParticipants>>
) {
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

export const actions = {
	joinChallenge: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		const profile = locals.profile;

		// Validate user is authenticated
		if (!session || !user || !profile) {
			return fail(401, { error: 'You must be logged in to join a challenge' });
		}

		// Parse form data
		const formData = await request.formData();
		const challengeId = formData.get('challengeId')?.toString();

		if (!challengeId) {
			return fail(400, { error: 'Challenge ID is required' });
		}

		// Load challenge
		const challenge = await db.query.challengesTable.findFirst({
			where: eq(challengesTable.id, challengeId)
		});

		if (!challenge) {
			return fail(404, { error: 'Challenge not found' });
		}

		// Validate challenge is joinable
		if (!isChallengeJoinable(challenge)) {
			return fail(400, { error: 'Challenge is not joinable. It may have ended or is not active.' });
		}

		// Check user is not already participating
		const existingParticipant = await checkUserParticipation(challengeId, profile.id);
		if (existingParticipant) {
			return fail(400, { error: 'You are already participating in this challenge' });
		}

		// Insert participant record
		try {
			await db.insert(challengeParticipantsTable).values({
				challengeId: challengeId,
				profileId: profile.id,
				status: PARTICIPANT_STATUS.REGISTERED
			});

			return { success: true };
		} catch (error) {
			console.error('Error joining challenge:', error);
			return fail(500, { error: 'Failed to join challenge. Please try again.' });
		}
	}
};
