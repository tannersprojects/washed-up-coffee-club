import type { ChallengeParticipantWithRelations } from '$lib/types/dashboard.js';
import {
	CHALLENGE_STATUS,
	CHALLENGE_JOIN_DISPLAY_STATE,
	COUNTDOWN_LABEL,
	type ChallengeTimeState
} from '$lib/constants';
import type { Challenge } from '$lib/db/schema';
import type { ChallengeUI } from '../../routes/(app)/dashboard/_logic/ChallengeUI.svelte';
import type { ChallengeJoinDisplayState } from '$lib/constants';

/**
 * Calculates the total distance in kilometers for all completed participants
 * @param leaderboard - Array of leaderboard rows
 * @param goalValueMeters - The challenge goal value in meters (or null if not set)
 * @returns Formatted string with total distance in KM (1 decimal place)
 */
export function calculateTotalDistanceKm(
	challengeParticipantsWithRelations: ChallengeParticipantWithRelations[],
	goalValueMeters: number | null
): string {
	if (!goalValueMeters) {
		return '0.0';
	}

	const totalKm = challengeParticipantsWithRelations.reduce((acc, participant) => {
		if (participant.status === 'completed' && goalValueMeters) {
			return acc + goalValueMeters / 1000;
		}
		// If they are in progress, we ideally use their current progress,
		// but for now we only have the completed goal value in the logic.
		return acc;
	}, 0);

	return totalKm.toFixed(1);
}

/**
 * Derives challenge time state from dates (status, targetDate, label).
 * Use this instead of challenge.status for UI logic.
 */
export function getChallengeTimeStateFromDates(
	startDate: Date | string,
	endDate: Date | string
): ChallengeTimeState {
	const now = new Date();
	const start = new Date(startDate);
	const end = new Date(endDate);

	if (now < start) {
		return {
			status: CHALLENGE_STATUS.UPCOMING,
			targetDate: start,
			label: COUNTDOWN_LABEL.TIME_UNTIL
		};
	}
	if (now < end) {
		return {
			status: CHALLENGE_STATUS.ACTIVE,
			targetDate: end,
			label: COUNTDOWN_LABEL.TIME_REMAINING
		};
	}
	return {
		status: CHALLENGE_STATUS.COMPLETED,
		targetDate: end,
		label: COUNTDOWN_LABEL.TIME_REMAINING
	};
}

/**
 * Validates if a challenge can be joined
 * @param challenge - The challenge to validate
 * @returns true if challenge is joinable, false otherwise
 */
export function isChallengeJoinable(challenge: ChallengeUI | Challenge | null): boolean {
	if (!challenge || !challenge.isActive) {
		return false;
	}

	const now = new Date();
	const endDate = new Date(challenge.endDate);
	if (now >= endDate) {
		return false;
	}

	return true;
}

/**
 * Gets the display state for a challenge join button
 * @param challenge - The challenge to check
 * @returns One of five display states: joinable, participating, ended, upcoming, not_active
 */
export function getChallengeJoinDisplayState(challenge: ChallengeUI): ChallengeJoinDisplayState {
	if (challenge.isParticipating) {
		return CHALLENGE_JOIN_DISPLAY_STATE.PARTICIPATING;
	}

	const timeState = getChallengeTimeStateFromDates(challenge.startDate, challenge.endDate);

	if (timeState.status === CHALLENGE_STATUS.COMPLETED) {
		return CHALLENGE_JOIN_DISPLAY_STATE.ENDED;
	}
	if (
		timeState.status === CHALLENGE_STATUS.ACTIVE ||
		timeState.status === CHALLENGE_STATUS.UPCOMING
	) {
		return CHALLENGE_JOIN_DISPLAY_STATE.JOINABLE;
	}

	return CHALLENGE_JOIN_DISPLAY_STATE.NOT_ACTIVE;
}
