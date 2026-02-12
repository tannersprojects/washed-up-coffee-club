import { ChallengeUI } from './ChallengeUI.svelte.js';
import type { DashboardContextData } from '$lib/types/dashboard.js';
import type {
	ChallengeParticipantWithRelations,
	ChallengeWithParticipation
} from '$lib/types/dashboard.js';
import { DashboardTabValue } from '$lib/types/dashboard.js';

export class DashboardUI {
	challenges: ChallengeUI[];
	selectedChallengeId: string | null;
	selectedChallenge: ChallengeUI | null;
	activeTab: DashboardTabValue;
	drawerOpen: boolean;
	sidebarPinned: boolean;
	sidebarHovered: boolean;

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
		this.activeTab = $state(DashboardTabValue.Challenges);
		this.drawerOpen = $state(false);
		this.sidebarPinned = $state(true);
		this.sidebarHovered = $state(false);

		// Initialize derived values
		this.selectedChallenge = $derived.by(() => {
			if (!this.selectedChallengeId) return null;
			return this.challenges.find((c) => c.id === this.selectedChallengeId) || null;
		});

		// TODO: Should this be done when the selected challenge is changed?
		// Select first challenge by default
		if (this.challenges.length > 0) {
			// Start countdown for first challenge
			this.challenges[0].startCountdown();
		}
	}

	static fromServerData({
		challengesWithParticipation,
		challengeParticipantsWithRelationsByChallenge
	}: DashboardContextData) {
		return new DashboardUI(
			challengesWithParticipation,
			challengeParticipantsWithRelationsByChallenge
		);
	}

	/**
	 * Set the active tab (Challenges or Club Leaderboard)
	 */
	setActiveTab(tab: DashboardTabValue) {
		this.activeTab = tab;
	}

	/**
	 * Open the challenges drawer (mobile)
	 */
	openChallengesDrawer() {
		this.drawerOpen = true;
	}

	/**
	 * Close the challenges drawer (mobile)
	 */
	closeChallengesDrawer() {
		this.drawerOpen = false;
	}

	/**
	 * Toggle sidebar pin state (desktop)
	 */
	toggleSidebarPin() {
		this.sidebarPinned = !this.sidebarPinned;
	}

	/**
	 * Set sidebar hover state (desktop)
	 */
	setSidebarHovered(hovered: boolean) {
		this.sidebarHovered = hovered;
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
	 * Update dashboard from fresh server data
	 * Syncs all challenges with their latest participation and leaderboard data
	 */
	updateFromServerData({
		challengesWithParticipation,
		challengeParticipantsWithRelationsByChallenge
	}: DashboardContextData) {
		// Update each existing challenge
		challengesWithParticipation.forEach((challengeData) => {
			const existingChallenge = this.challenges.find((c) => c.id === challengeData.id);
			if (existingChallenge) {
				const participants = challengeParticipantsWithRelationsByChallenge[challengeData.id] || [];
				existingChallenge.updateFromServerData(challengeData, participants);
			}
		});
	}

	cleanup() {
		this.challenges.forEach((c) => c.stopCountdown());
	}
}
