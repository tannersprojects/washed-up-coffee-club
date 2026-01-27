import { ChallengeUI } from './ChallengeUI.svelte.js';
import type { DashboardServerData } from './context.js';
import type {
	ChallengeParticipantWithRelations,
	ChallengeWithParticipation
} from '$lib/types/dashboard.js';

export class DashboardUI {
	// Challenge and leaderboard collections
	challenges: ChallengeUI[];

	// Selection state
	selectedChallengeId: string | null;

	// UI state
	isSubmitting: boolean;

	// Derived selected challenge and leaderboard
	selectedChallenge: ChallengeUI | null;

	constructor(
		challengesWithParticipation: ChallengeWithParticipation[],
		challengeParticipantsWithRelationsByChallenge: Record<
			string,
			ChallengeParticipantWithRelations[]
		>
	) {
		// Hydrate challenges into class instances
		const challenges = challengesWithParticipation.map(
			(c) => new ChallengeUI(c, challengeParticipantsWithRelationsByChallenge[c.id])
		);
		this.challenges = $state(challenges);

		// Initialize UI state
		this.selectedChallengeId = $state(challengesWithParticipation[0]?.id || null);
		this.isSubmitting = $state(false);

		// Initialize derived values
		this.selectedChallenge = $derived.by(() => {
			if (!this.selectedChallengeId) return null;
			return this.challenges.find((c) => c.id === this.selectedChallengeId) || null;
		});

		// Select first challenge by default
		if (this.challenges.length > 0) {
			// Start countdown for first challenge
			this.challenges[0].startCountdown();
		}
	}

	static fromServerData({
		challengesWithParticipation,
		challengeParticipantsWithRelationsByChallenge
	}: DashboardServerData) {
		return new DashboardUI(
			challengesWithParticipation,
			challengeParticipantsWithRelationsByChallenge
		);
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
	// handleTabChange(tab: 'leaderboard' | 'details') {
	// 	this.activeTab = tab;
	// }

	// joinChallenge(challengeId: string, challengeParticipant: ChallengeParticipant) {
	// 	const challenge = this.challenges.find((c) => c.id === challengeId);
	// 	if (!challenge) {
	// 		// TODO: Handle error
	// 		return;
	// 	}

	// 	challenge.isParticipating = true;
	// 	challenge.participant = challengeParticipant;
	// 	this.isSubmitting = false;
	// }

	// leaveChallenge(challengeId: string) {
	// 	const challenge = this.challenges.find((c) => c.id === challengeId);
	// 	if (!challenge) {
	// 		// TODO: Handle error
	// 		return;
	// 	}

	// 	challenge.isParticipating = false;
	// 	challenge.participant = null;
	// 	this.isSubmitting = false;
	// }

	/**
	 * Cleanup - stop all countdowns
	 * Call this when dashboard is unmounted
	 */
	cleanup() {
		this.challenges.forEach((c) => c.stopCountdown());
	}
}
