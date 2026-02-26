import type { DashboardContextData } from '$lib/types/dashboard';
import { getContext, setContext } from 'svelte';
import { getUserPreferencesContext } from '$lib/state/user-preferences.svelte.js';
import { DashboardUI } from './DashboardUI.svelte';

const KEY = Symbol('DASHBOARD_CTX');

export function setDashboardContext(data: DashboardContextData) {
	const prefs = getUserPreferencesContext();
	const dashboard = DashboardUI.fromServerData(data, prefs.distanceUnit);
	return setContext<DashboardUI>(KEY, dashboard);
}

export function getDashboardContext(): DashboardUI {
	return getContext<DashboardUI>(KEY);
}
