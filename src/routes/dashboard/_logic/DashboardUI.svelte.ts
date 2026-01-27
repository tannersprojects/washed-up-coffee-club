import { ChallengeUI } from './ChallengeUI.svelte.js';
import { LeaderboardUI } from './LeaderboardUI.svelte.js';
import type { ChallengeParticipant } from '$lib/db/schema.js';
import type { DashboardServerData } from './context.js';

/**
 * DashboardUI class - Parent manager for dashboard state
 *
 * Manages:
 * - Collection of ChallengeUI instances
 * - Collection of LeaderboardUI instances
 * - Challenge selection state
 * - Active tab state
 * - Form submission state
 * - Context provision to child components
 */
export class DashboardUI {
	// Challenge and leaderboard collections
	challenges: ChallengeUI[];
	leaderboards: Record<string, LeaderboardUI>;

	// Selection state
	selectedChallengeId: string | null;

	// UI state
	activeTab: 'leaderboard' | 'details';
	isSubmitting: boolean;

	// Derived selected challenge and leaderboard
	selectedChallenge: ChallengeUI | null;
	selectedLeaderboard: LeaderboardUI | null;

	constructor(data: DashboardServerData) {
		// Hydrate challenges into class instances
		this.challenges = $state(data.challenges.map((c) => new ChallengeUI(c)));

		// Hydrate leaderboards into class instances
		this.leaderboards = $state(
			Object.fromEntries(
				Object.entries(data.leaderboards).map(([id, rows]) => {
					const challenge = this.challenges.find((c) => c.id === id);
					return [id, new LeaderboardUI(rows, challenge?.goalValue ?? null)];
				})
			)
		);

		// Initialize UI state
		this.selectedChallengeId = $state(data.challenges[0]?.id || null);
		this.activeTab = $state('leaderboard');
		this.isSubmitting = $state(false);

		// Initialize derived values
		this.selectedChallenge = $derived.by(() => {
			if (!this.selectedChallengeId) return null;
			return this.challenges.find((c) => c.id === this.selectedChallengeId) || null;
		});

		this.selectedLeaderboard = $derived.by(() => {
			if (!this.selectedChallengeId) return null;
			return this.leaderboards[this.selectedChallengeId] || null;
		});

		// Select first challenge by default
		if (this.challenges.length > 0) {
			// Start countdown for first challenge
			this.challenges[0].startCountdown();
		}
	}

	syncWithServer(data: DashboardServerData) {
		// Stop countdowns on old challenges
		this.challenges.forEach((c) => c.stopCountdown());

		// Preserve the currently selected challenge ID
		const preservedSelectedId = this.selectedChallengeId;

		// Create new ChallengeUI instances with updated data
		this.challenges = data.challenges.map((c) => new ChallengeUI(c));

		// Create new LeaderboardUI instances
		this.leaderboards = Object.fromEntries(
			Object.entries(data.leaderboards).map(([id, rows]) => {
				const challenge = this.challenges.find((c) => c.id === id);
				return [id, new LeaderboardUI(rows, challenge?.goalValue ?? null)];
			})
		);

		// Restore selected challenge if it still exists, otherwise select first
		if (preservedSelectedId && this.challenges.find((c) => c.id === preservedSelectedId)) {
			this.selectedChallengeId = preservedSelectedId;
			// Restart countdown on selected challenge
			const selected = this.challenges.find((c) => c.id === preservedSelectedId);
			if (selected) {
				selected.startCountdown();
			}
		} else if (this.challenges.length > 0) {
			// Select first challenge if previous selection no longer exists
			this.selectedChallengeId = this.challenges[0].id;
			this.challenges[0].startCountdown();
		} else {
			this.selectedChallengeId = null;
		}
	}

	/**
	 * Select a different challenge
	 * Stops countdown on previous, starts on new
	 */
	selectChallenge(id: string) {
		// Stop countdown on currently selected challenge
		if (this.selectedChallenge) {
			this.selectedChallenge.stopCountdown();
		}

		// Update selection
		this.selectedChallengeId = id;

		// Start countdown on newly selected challenge
		if (this.selectedChallenge) {
			this.selectedChallenge.startCountdown();
		}
	}

	/**
	 * Handle tab change
	 */
	handleTabChange(tab: 'leaderboard' | 'details') {
		this.activeTab = tab;
	}

	joinChallenge(challengeId: string, challengeParticipant: ChallengeParticipant) {
		const challenge = this.challenges.find((c) => c.id === challengeId);
		if (!challenge) {
			// TODO: Handle error
			return;
		}

		challenge.isParticipating = true;
		challenge.participant = challengeParticipant;
		this.isSubmitting = false;
	}

	leaveChallenge(challengeId: string) {
		const challenge = this.challenges.find((c) => c.id === challengeId);
		if (!challenge) {
			// TODO: Handle error
			return;
		}

		challenge.isParticipating = false;
		challenge.participant = null;
		this.isSubmitting = false;
	}

	/**
	 * Cleanup - stop all countdowns
	 * Call this when dashboard is unmounted
	 */
	cleanup() {
		this.challenges.forEach((c) => c.stopCountdown());
	}
}
