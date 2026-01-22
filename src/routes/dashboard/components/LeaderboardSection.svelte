<script lang="ts">
	import type { Challenge } from '$lib/db/schema';
	import type { LeaderboardRow } from '../types.js';
	import LeaderboardTabs from './LeaderboardTabs.svelte';
	import LeaderboardTable from './LeaderboardTable.svelte';
	import ChallengeDetails from './ChallengeDetails.svelte';

	type Tab = 'leaderboard' | 'details';

	type Props = {
		leaderboard: LeaderboardRow[];
		challenge: Challenge;
		activeTab: Tab;
		onTabChange: (tab: Tab) => void;
	};

	let { leaderboard, challenge, activeTab, onTabChange }: Props = $props();
</script>

<section class="mx-auto max-w-5xl px-6">
	<LeaderboardTabs {activeTab} {onTabChange} />

	{#if activeTab === 'leaderboard'}
		<LeaderboardTable {leaderboard} {challenge} />
	{:else if activeTab === 'details'}
		<ChallengeDetails {challenge} />
	{/if}
</section>
