<script lang="ts">
	import { getDashboardContext } from '../_logic/context.js';
	import LeaderboardTabs from './LeaderboardTabs.svelte';
	import LeaderboardTable from './LeaderboardTable.svelte';
	import ChallengeDetails from './ChallengeDetails.svelte';

	const dashboard = getDashboardContext();
	const challenge = $derived(dashboard.selectedChallenge);
	const activeTab = $derived(challenge?.activeTab);
</script>

<section class="mx-auto max-w-5xl px-6">
	<LeaderboardTabs />

	{#if activeTab === 'leaderboard'}
		<LeaderboardTable />
	{:else if activeTab === 'details'}
		<ChallengeDetails />
	{/if}
</section>
