<script lang="ts">
	import { getDashboardContext } from '../_logic/context.js';
	import Tabs from '$lib/components/Tabs.svelte';
	import { LEADERBOARD_TAB, LEADERBOARD_TAB_LABEL, type LeaderboardTab } from '$lib/constants';

	const dashboard = getDashboardContext();
	const challenge = $derived(dashboard.selectedChallenge);
	const activeTab = $derived(challenge?.activeTab ?? 'leaderboard');

	const tabs = [
		{ value: LEADERBOARD_TAB.Leaderboard, label: LEADERBOARD_TAB_LABEL.Leaderboard },
		{ value: LEADERBOARD_TAB.Details, label: LEADERBOARD_TAB_LABEL.Details }
	];

	function handleSelect(value: string) {
		challenge?.setActiveTab(value as LeaderboardTab);
	}
</script>

<Tabs {tabs} value={activeTab} onSelect={handleSelect} class="mb-8" />
