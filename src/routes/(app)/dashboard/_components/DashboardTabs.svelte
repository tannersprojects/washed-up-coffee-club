<script lang="ts">
	import Tabs from '$lib/components/Tabs.svelte';
	import { DashboardTabValue, DashboardTabLabel } from '$lib/types/dashboard.js';
	import { getDashboardContext } from '../_logic/context.js';

	const dashboard = getDashboardContext();

	const tabs = [
		{ value: DashboardTabValue.Challenges, label: DashboardTabLabel.Challenges },
		{ value: DashboardTabValue.ClubLeaderboard, label: DashboardTabLabel.ClubLeaderboard }
	];
</script>

<Tabs
	{tabs}
	value={dashboard.activeTab}
	onSelect={(v) => dashboard.setActiveTab(v as DashboardTabValue)}
/>
