import type { ChallengeWithParticipation, LeaderboardRow } from '$lib/types/dashboard';
import { getContext, setContext } from 'svelte';
import { DashboardUI } from './DashboardUI.svelte';

const KEY = Symbol('DASHBOARD_CTX');

export type DashboardServerData = {
	challenges: ChallengeWithParticipation[];
	leaderboards: Record<string, LeaderboardRow[]>;
};

export function setDashboardContext(data: DashboardServerData) {
	const dashboard = new DashboardUI(data);
	return setContext<DashboardUI>(KEY, dashboard);
}

export function getDashboardContext(): DashboardUI {
	return getContext<DashboardUI>(KEY);
}
