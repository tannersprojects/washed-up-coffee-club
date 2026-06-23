import { ChallengeUI } from './ChallengeUI.svelte.js';
import type { DashboardContextData, DashboardChallenge } from '$lib/types/dashboard.js';
import { DASHBOARD_TAB, type DashboardTab, type DistanceUnit } from '$lib/constants';
import { resolveSelectedChallengeId } from './resolveSelectedChallengeId.js';

export class DashboardUI {
	// Data
	challenges: ChallengeUI[];
	selectedChallengeId: string | null;
	selectedChallenge: ChallengeUI | null;
	sidebarExpanded: boolean;

	// UI state
	activeTab: DashboardTab;
	drawerOpen: boolean;
	sidebarPinned: boolean;
	sidebarHovered: boolean;

	// Config
	readonly distanceUnit: DistanceUnit;

	constructor(
		dashboardChallenges: DashboardChallenge[],
		profileId: string,
		distanceUnit: DistanceUnit,
		initialSelectedChallengeId: string | null = null
	) {
		this.distanceUnit = distanceUnit;

		// Challenges
		const challenges = dashboardChallenges.map((c) => new ChallengeUI(c, profileId, distanceUnit));
		this.challenges = $state(challenges);

		// Selection — resolve from server-validated initial ID (already sorted latest first)
		this.selectedChallengeId = $state(
			resolveSelectedChallengeId(dashboardChallenges, initialSelectedChallengeId)
		);

		// UI state
		this.activeTab = $state(DASHBOARD_TAB.Challenges);
		this.drawerOpen = $state(false);
		this.sidebarPinned = $state(true);
		this.sidebarHovered = $state(false);

		// Derived
		this.selectedChallenge = $derived.by(() => {
			if (!this.selectedChallengeId) return null;
			return this.findChallengeById(this.selectedChallengeId!) ?? null;
		});
		this.sidebarExpanded = $derived(this.sidebarPinned || this.sidebarHovered);
	}

	private findChallengeById(id: string): ChallengeUI | undefined {
		return this.challenges.find((c) => c.id === id);
	}

	static fromServerData(data: DashboardContextData, distanceUnit: DistanceUnit) {
		return new DashboardUI(
			data.dashboardChallenges,
			data.profile.id,
			distanceUnit,
			data.initialSelectedChallengeId
		);
	}

	// Selection
	selectChallenge(id: string) {
		this.selectedChallengeId = id;
	}

	// Tabs
	setActiveTab(tab: DashboardTab) {
		this.activeTab = tab;
	}

	// Drawer
	openChallengesDrawer() {
		this.drawerOpen = true;
	}

	closeChallengesDrawer() {
		this.drawerOpen = false;
	}

	// Sidebar
	toggleSidebarPin() {
		this.sidebarPinned = !this.sidebarPinned;
	}

	setSidebarHovered(hovered: boolean) {
		this.sidebarHovered = hovered;
	}

	// Server sync
	updateFromServerData({ dashboardChallenges }: DashboardContextData) {
		dashboardChallenges.forEach((dashboardChallenge) => {
			const existing = this.findChallengeById(dashboardChallenge.id);
			if (existing) existing.updateFromServerData(dashboardChallenge);
		});
	}

	// Lifecycle
	cleanup() {
		this.challenges.forEach((c) => c.cleanup());
	}
}
