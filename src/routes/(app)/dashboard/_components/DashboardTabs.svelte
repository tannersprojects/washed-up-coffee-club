<script lang="ts">
	import Tabs from '$lib/components/Tabs.svelte';
	import { DASHBOARD_TAB, DASHBOARD_TAB_LABEL, type DashboardTab } from '$lib/types/dashboard.js';
	import { getDashboardContext } from '../_logic/context.js';

	const dashboard = getDashboardContext();

	const tabs = [
		{ value: DASHBOARD_TAB.Challenges, label: DASHBOARD_TAB_LABEL.Challenges },
		{ value: DASHBOARD_TAB.ClubLeaderboard, label: DASHBOARD_TAB_LABEL.ClubLeaderboard }
	];
</script>

<Tabs
	{tabs}
	value={dashboard.activeTab}
	onSelect={(v: string) => dashboard.setActiveTab(v as DashboardTab)}
/>
