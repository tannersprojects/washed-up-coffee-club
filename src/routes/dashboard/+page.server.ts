import { fail, redirect } from '@sveltejs/kit';
import { isChallengeJoinable } from '$lib/utils/challenge-utils.js';
import {
	loadDashboardData,
	checkUserParticipation,
	joinChallenge,
	loadChallenge,
	leaveChallenge,
	loadChallengeParticipantWithRelations
} from './loader.server.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }: { locals: App.Locals }) => {
	const { session, user } = await locals.safeGetSession();
	const profile = locals.profile;

	if (!session || !user || !profile) {
		throw redirect(302, '/');
	}

	// Load dashboard data (challenges + leaderboards) in optimized way
	const { challengesWithParticipation, challengeParticipantsWithRelationsByChallenge } =
		await loadDashboardData(profile.id);

	return {
		user,
		profile,
		challengesWithParticipation,
		challengeParticipantsWithRelationsByChallenge
	};
};

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
		const challenge = await loadChallenge(challengeId);

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
			const { id } = await joinChallenge(challengeId, profile.id);
			const challengeParticipantWithRelations = await loadChallengeParticipantWithRelations(id);

			if (!challengeParticipantWithRelations) {
				throw new Error('Failed to load participant after joining challenge. Please try again.');
			}

			return { success: true, challengeParticipantWithRelations };
		} catch (error) {
			console.error('Error joining challenge:', error);
			return fail(500, { error: 'Failed to join challenge. Please try again.' });
		}
	},
	leaveChallenge: async ({ request, locals }) => {
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
		const challenge = await loadChallenge(challengeId);
		if (!challenge) {
			return fail(404, { error: 'Challenge not found' });
		}

		// Validate challenge is joinable
		if (!isChallengeJoinable(challenge)) {
			return fail(400, { error: 'Challenge is not joinable. It may have ended or is not active.' });
		}

		// Check user is not already participating
		const existingParticipant = await checkUserParticipation(challengeId, profile.id);
		if (!existingParticipant) {
			return fail(400, { error: 'You are not participating in this challenge' });
		}

		// Delete participant record
		try {
			await leaveChallenge(existingParticipant.id);

			return { success: true, challengeId };
		} catch (error) {
			return fail(500, { error: `Failed to leave challenge: ${error}. \nPlease try again.` });
		}
	}
};
