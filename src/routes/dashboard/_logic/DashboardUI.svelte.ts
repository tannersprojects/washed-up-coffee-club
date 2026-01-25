import { setContext, getContext } from 'svelte';
import { ChallengeUI } from './ChallengeUI.svelte.js';
import { LeaderboardUI } from './LeaderboardUI.svelte.js';
import type { ChallengeWithParticipation, LeaderboardRow } from '$lib/types/dashboard.js';

const KEY = Symbol('DASHBOARD_CTX');

/**
 * Server data structure for initializing DashboardUI
 */
export type DashboardServerData = {
	challenges: ChallengeWithParticipation[];
	leaderboards: Record<string, LeaderboardRow[]>;
};

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

	/**
	 * Handle join challenge form submission
	 * Manages isSubmitting state around async callback
	 */
	async handleJoinChallenge(callback: () => Promise<void>) {
		this.isSubmitting = true;
		try {
			await callback();
		} finally {
			this.isSubmitting = false;
		}
	}

	/**
	 * Cleanup - stop all countdowns
	 * Call this when dashboard is unmounted
	 */
	cleanup() {
		this.challenges.forEach((c) => c.stopCountdown());
	}
}

/**
 * Initialize DashboardUI context with server data
 * Call this once in +page.svelte
 */
export function initDashboardUI(data: DashboardServerData): DashboardUI {
	const dashboard = new DashboardUI(data);
	setContext(KEY, dashboard);
	return dashboard;
}

/**
 * Get DashboardUI context
 * Call this in components that need dashboard state
 */
export function getDashboardUI(): DashboardUI {
	return getContext<DashboardUI>(KEY);
}
