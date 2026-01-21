/**
 * Type representing a leaderboard row
 */
type LeaderboardRow = {
	participant: {
		status: string | null;
		[key: string]: unknown;
	};
	[key: string]: unknown;
};

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
