import { fail, redirect } from '@sveltejs/kit';
import type { DashboardContextData } from '$lib/types/dashboard.js';
import { isChallengeJoinable } from '$lib/utils/challenge.js';
import { LoggingEvents } from '$lib/server/logging/events';
import { serializeError } from '$lib/server/logging/logger';
import {
	checkUserParticipation,
	joinChallenge,
	loadChallenge,
	leaveChallenge,
	loadChallengeParticipantWithRelations,
	loadDashboardData
} from './loader.server.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ parent }): Promise<DashboardContextData> => {
	const { profile } = await parent();

	if (!profile) {
		throw redirect(302, '/');
	}

	const dashboardChallenges = await loadDashboardData();

	return {
		profile,
		dashboardChallenges
	};
};

export const actions = {
	joinChallenge: async ({ request, locals }) => {
		const { logger } = locals;
		const { session, user } = await locals.safeGetSession();
		const profile = locals.profile;

		if (!session || !user || !profile) {
			logger.warn(
				{ event: LoggingEvents.CHALLENGE_JOIN_FAILED, reason: 'unauthenticated' },
				'join challenge failed'
			);
			return fail(401, { error: 'You must be logged in to join a challenge' });
		}

		const formData = await request.formData();
		const challengeId = formData.get('challengeId')?.toString();

		if (!challengeId) {
			logger.warn(
				{
					event: LoggingEvents.CHALLENGE_JOIN_FAILED,
					reason: 'missing_challenge_id',
					profileId: profile.id
				},
				'join challenge failed'
			);
			return fail(400, { error: 'Challenge ID is required' });
		}

		const challenge = await loadChallenge(challengeId);

		if (!challenge) {
			logger.warn(
				{
					event: LoggingEvents.CHALLENGE_JOIN_FAILED,
					reason: 'challenge_not_found',
					profileId: profile.id,
					challengeId
				},
				'join challenge failed'
			);
			return fail(404, { error: 'Challenge not found' });
		}

		if (!isChallengeJoinable(challenge)) {
			logger.warn(
				{
					event: LoggingEvents.CHALLENGE_JOIN_FAILED,
					reason: 'not_joinable',
					profileId: profile.id,
					challengeId
				},
				'join challenge failed'
			);
			return fail(400, {
				error: 'Challenge is not joinable. It may have ended or is not active.'
			});
		}

		const existingParticipant = await checkUserParticipation(challengeId, profile.id);
		if (existingParticipant) {
			logger.warn(
				{
					event: LoggingEvents.CHALLENGE_JOIN_FAILED,
					reason: 'already_participating',
					profileId: profile.id,
					challengeId
				},
				'join challenge failed'
			);
			return fail(400, { error: 'You are already participating in this challenge' });
		}

		logger.info(
			{ event: LoggingEvents.CHALLENGE_JOIN_REQUESTED, profileId: profile.id, challengeId },
			'join challenge requested'
		);

		try {
			const { id } = await joinChallenge(challengeId, profile.id);
			const challengeParticipantWithRelations = await loadChallengeParticipantWithRelations(id);

			if (!challengeParticipantWithRelations) {
				throw new Error('Failed to load participant after joining challenge. Please try again.');
			}

			logger.info(
				{
					event: LoggingEvents.CHALLENGE_JOIN_SUCCEEDED,
					profileId: profile.id,
					challengeId,
					participantId: id
				},
				'join challenge succeeded'
			);

			return { success: true, challengeParticipantWithRelations };
		} catch (error) {
			logger.error(
				{
					event: LoggingEvents.CHALLENGE_JOIN_FAILED,
					err: serializeError(error),
					profileId: profile.id,
					challengeId
				},
				'join challenge failed'
			);
			return fail(500, { error: 'Failed to join challenge. Please try again.' });
		}
	},
	leaveChallenge: async ({ request, locals }) => {
		const { logger } = locals;
		const { session, user } = await locals.safeGetSession();
		const profile = locals.profile;

		if (!session || !user || !profile) {
			logger.warn(
				{ event: LoggingEvents.CHALLENGE_LEAVE_FAILED, reason: 'unauthenticated' },
				'leave challenge failed'
			);
			return fail(401, { error: 'You must be logged in to leave a challenge' });
		}

		const formData = await request.formData();
		const challengeId = formData.get('challengeId')?.toString();

		if (!challengeId) {
			logger.warn(
				{
					event: LoggingEvents.CHALLENGE_LEAVE_FAILED,
					reason: 'missing_challenge_id',
					profileId: profile.id
				},
				'leave challenge failed'
			);
			return fail(400, { error: 'Challenge ID is required' });
		}

		const challenge = await loadChallenge(challengeId);
		if (!challenge) {
			logger.warn(
				{
					event: LoggingEvents.CHALLENGE_LEAVE_FAILED,
					reason: 'challenge_not_found',
					profileId: profile.id,
					challengeId
				},
				'leave challenge failed'
			);
			return fail(404, { error: 'Challenge not found' });
		}

		if (!isChallengeJoinable(challenge)) {
			logger.warn(
				{
					event: LoggingEvents.CHALLENGE_LEAVE_FAILED,
					reason: 'not_joinable',
					profileId: profile.id,
					challengeId
				},
				'leave challenge failed'
			);
			return fail(400, {
				error: 'Challenge is not joinable. It may have ended or is not active.'
			});
		}

		const existingParticipant = await checkUserParticipation(challengeId, profile.id);
		if (!existingParticipant) {
			logger.warn(
				{
					event: LoggingEvents.CHALLENGE_LEAVE_FAILED,
					reason: 'not_participating',
					profileId: profile.id,
					challengeId
				},
				'leave challenge failed'
			);
			return fail(400, { error: 'You are not participating in this challenge' });
		}

		logger.info(
			{
				event: LoggingEvents.CHALLENGE_LEAVE_REQUESTED,
				profileId: profile.id,
				challengeId,
				participantId: existingParticipant.id
			},
			'leave challenge requested'
		);

		try {
			await leaveChallenge(existingParticipant.id);

			logger.info(
				{
					event: LoggingEvents.CHALLENGE_LEAVE_SUCCEEDED,
					profileId: profile.id,
					challengeId,
					participantId: existingParticipant.id
				},
				'leave challenge succeeded'
			);

			return { success: true, challengeId };
		} catch (error) {
			logger.error(
				{
					event: LoggingEvents.CHALLENGE_LEAVE_FAILED,
					err: serializeError(error),
					profileId: profile.id,
					challengeId,
					participantId: existingParticipant.id
				},
				'leave challenge failed'
			);
			return fail(500, { error: 'Failed to leave challenge. Please try again.' });
		}
	}
};
