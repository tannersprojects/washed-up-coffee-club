import type { LeaderboardRow } from '$routes/dashboard/types.js';
import type { Challenge } from '$lib/db/schema';
import { CHALLENGE_STATUS } from '$lib/constants/challenge_status.js';

/**
 * Calculates the total distance in kilometers for all completed participants
 * @param leaderboard - Array of leaderboard rows
 * @param goalValueMeters - The challenge goal value in meters (or null if not set)
 * @returns Formatted string with total distance in KM (1 decimal place)
 */
export function calculateTotalDistanceKm(
	leaderboard: LeaderboardRow[],
	goalValueMeters: number | null
): string {
	if (!goalValueMeters) {
		return '0.0';
	}

	const totalKm = leaderboard.reduce((acc, row) => {
		if (row.participant.status === 'completed' && goalValueMeters) {
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
export function isChallengeJoinable(challenge: Challenge | null): boolean {
	if (!challenge) {
		return false;
	}

	const now = new Date();

	// Check challenge is active
	if (challenge.status !== CHALLENGE_STATUS.ACTIVE) {
		return false;
	}

	// Check challenge is marked as active
	if (!challenge.isActive) {
		return false;
	}

	// Check challenge hasn't ended
	const endDate = new Date(challenge.endDate);
	if (now >= endDate) {
		return false;
	}

	// Check challenge has started (optional but good practice)
	const startDate = new Date(challenge.startDate);
	if (now < startDate) {
		return false;
	}

	return true;
}
