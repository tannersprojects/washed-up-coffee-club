import type {
	ChallengeParticipantWithRelations,
	ChallengeWithParticipation
} from '$lib/types/dashboard';
import { getContext, setContext } from 'svelte';
import { DashboardUI } from './DashboardUI.svelte';

const KEY = Symbol('DASHBOARD_CTX');

export type DashboardServerData = {
	challengesWithParticipation: ChallengeWithParticipation[];
	challengeParticipantsWithRelationsByChallenge: Record<
		string,
		ChallengeParticipantWithRelations[]
	>;
};

export function setDashboardContext(data: DashboardServerData) {
	const dashboard = DashboardUI.fromServerData(data);
	return setContext<DashboardUI>(KEY, dashboard);
}

export function getDashboardContext(): DashboardUI {
	return getContext<DashboardUI>(KEY);
}
