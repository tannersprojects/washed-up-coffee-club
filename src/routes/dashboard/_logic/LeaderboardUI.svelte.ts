import type { LeaderboardRow, ChallengeStats } from '$lib/types/dashboard.js';
import { calculateTotalDistanceKm } from '$lib/utils/challenge-utils.js';

/**
 * LeaderboardUI class - Manages leaderboard data and statistics calculations
 *
 * This class transforms raw participant data into reactive leaderboard state with:
 * - Sorted leaderboard rows
 * - Derived statistics (total runners, finishers, active runners)
 * - Total distance calculations
 * - Challenge stats object for components
 */
export class LeaderboardUI {
	// Reactive state
	rows: LeaderboardRow[];
	private goalValue: number | null;

	// Derived statistics
	get totalRunners(): number {
		return this.rows.length;
	}

	get finishers(): number {
		return this.rows.filter((row) => row.participant.status === 'completed').length;
	}

	get activeRunners(): number {
		return this.rows.filter((row) => row.participant.status === 'in_progress').length;
	}

	get totalDistanceKm(): string {
		return calculateTotalDistanceKm(this.rows, this.goalValue);
	}

	get stats(): ChallengeStats {
		return {
			totalRunners: this.totalRunners,
			finishers: this.finishers,
			activeRunners: this.activeRunners,
			totalDistanceKm: this.totalDistanceKm
		};
	}

	constructor(rows: LeaderboardRow[], goalValue: number | null) {
		this.rows = $state(rows);
		this.goalValue = $state(goalValue);
	}

	/**
	 * Update leaderboard rows
	 * Used when data refreshes from server
	 */
	updateRows(rows: LeaderboardRow[]) {
		this.rows = rows;
	}

	/**
	 * Update goal value
	 * Used when challenge data changes
	 */
	updateGoalValue(goalValue: number | null) {
		this.goalValue = goalValue;
	}
}
