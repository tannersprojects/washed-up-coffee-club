<script lang="ts">
	import type { Challenge } from '$lib/db/schema';
	import type { LeaderboardRow } from '../types.js';
	import LeaderboardRowComponent from './LeaderboardRow.svelte';
	import EmptyState from './EmptyState.svelte';

	type Props = {
		leaderboard: LeaderboardRow[];
		challenge: Challenge;
	};

	let { leaderboard, challenge }: Props = $props();
</script>

<!-- List Header -->
<div
	class="grid grid-cols-[30px_1fr_1fr_auto] gap-4 border-b border-white/20 px-4 py-3 font-mono text-[10px] tracking-widest text-gray-500 uppercase md:grid-cols-[50px_2fr_1fr_1fr_1fr_1fr]"
>
	<div class="text-center">#</div>
	<div>Athlete</div>
	<div class="hidden md:block">Activity</div>
	<div class="text-right">Distance</div>
	<div class="text-right">Pace</div>
	<div class="text-right">Time/Status</div>
</div>

<!-- List Rows -->
<div class="flex flex-col">
	{#each leaderboard as row, i}
		<LeaderboardRowComponent {row} {challenge} index={i} />
	{/each}

	<!-- Empty State if no runners -->
	{#if leaderboard.length === 0}
		<EmptyState
			title="No participants yet."
			message="Be the first to toe the line."
			variant="no-participants"
		/>
	{/if}
</div>
