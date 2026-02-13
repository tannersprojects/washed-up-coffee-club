<script lang="ts">
	import { getDashboardContext } from '../_logic/context.js';
	import LeaderboardTabs from './LeaderboardTabs.svelte';
	import LeaderboardTable from './LeaderboardTable.svelte';
	import ChallengeDetails from './ChallengeDetails.svelte';
	import { LEADERBOARD_TAB } from '$lib/types/dashboard.js';

	const dashboard = getDashboardContext();
	const challenge = $derived(dashboard.selectedChallenge);
	const activeTab = $derived(challenge?.activeTab);
</script>

<section class="w-full px-6 pb-10 sm:pb-0">
	<LeaderboardTabs />

	{#if activeTab === LEADERBOARD_TAB.Leaderboard}
		<LeaderboardTable />
	{:else if activeTab === LEADERBOARD_TAB.Details}
		<ChallengeDetails />
	{/if}
</section>
