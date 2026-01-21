import { db } from '$lib/db';
import { challengeParticipantsTable, challengesTable } from '$lib/db/schema';
import { redirect } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';

export const load = async ({ locals }: { locals: App.Locals }) => {
	const { session, user } = await locals.safeGetSession();
	const profile = locals.profile;

	if (!session || !user || !profile) {
		throw redirect(302, '/');
	}

	const challenge = await loadActiveChallenge();

	if (!challenge) {
		return {
			user,
			profile,
			challenge: null,
			leaderboard: null
		};
	}

	const challengeParticipants = await loadChallengeParticipants(challenge.id);
	const leaderboard = buildLeaderboard(challengeParticipants);

	return {
		user,
		profile,
		challenge,
		leaderboard
	};
};

async function loadActiveChallenge() {
	const challenges = await db.query.challengesTable.findFirst({
		where: eq(challengesTable.isActive, true)
	});

	return challenges;
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
