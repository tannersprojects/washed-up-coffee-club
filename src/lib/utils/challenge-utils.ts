import type { ChallengeParticipantWithRelations } from '$lib/types/dashboard.js';
import { CHALLENGE_STATUS, CHALLENGE_JOIN_DISPLAY_STATE } from '$lib/constants';
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
 * Validates if a challenge can be joined
 * @param challenge - The challenge to validate
 * @returns true if challenge is joinable, false otherwise
 */
export function isChallengeJoinable(challenge: ChallengeUI | Challenge | null): boolean {
	if (!challenge || !challenge.isActive) {
		return false;
	}

	// Check challenge is no completed
	if (challenge.status === CHALLENGE_STATUS.COMPLETED) {
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

	const now = new Date();
	const endDate = new Date(challenge.endDate);

	if (now >= endDate) {
		return CHALLENGE_JOIN_DISPLAY_STATE.ENDED;
	}

	// Use status only (not isActive) - ACTIVE or UPCOMING are joinable
	if (
		challenge.status === CHALLENGE_STATUS.ACTIVE ||
		challenge.status === CHALLENGE_STATUS.UPCOMING
	) {
		return CHALLENGE_JOIN_DISPLAY_STATE.JOINABLE;
	}

	return CHALLENGE_JOIN_DISPLAY_STATE.NOT_ACTIVE;
}
