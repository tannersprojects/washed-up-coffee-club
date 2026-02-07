import type {
	ChallengeParticipantWithRelations,
	ChallengeWithParticipation,
	DashboardContextData
} from '$lib/types/dashboard';
import { getContext, setContext } from 'svelte';
import { DashboardUI } from './DashboardUI.svelte';

const KEY = Symbol('DASHBOARD_CTX');

export function setDashboardContext(data: DashboardContextData) {
	const dashboard = DashboardUI.fromServerData(data);
	return setContext<DashboardUI>(KEY, dashboard);
}

export function getDashboardContext(): DashboardUI {
	return getContext<DashboardUI>(KEY);
}
