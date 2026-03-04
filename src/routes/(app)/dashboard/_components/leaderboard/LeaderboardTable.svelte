<script lang="ts">
	import { getDashboardContext } from '../../_logic/context.js';
	import LeaderboardRow from './LeaderboardRow.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { EMPTY_STATE_VARIANT } from '$lib/constants';

	const dashboard = getDashboardContext();
	let challenge = $derived(dashboard.selectedChallenge);
	let leaderboard = $derived(challenge?.leaderboard);
	let rows = $derived(leaderboard?.leaderboardRows || []);
</script>

<div class="flex flex-col">
	<!-- List Header (hidden on mobile per two-row card layout) -->
	<div
		class="sticky top-0 z-10 hidden border-b border-white/10 bg-black/80 px-4 py-3 font-mono text-[10px] tracking-widest text-gray-500 uppercase backdrop-blur-sm md:grid md:grid-cols-[50px_2fr_1fr_1fr_1fr_1fr] md:gap-4"
	>
		<div class="text-center">#</div>
		<div class="md:border-l md:border-white/10 md:pl-4">Athlete</div>
		<div class="hidden md:block md:border-l md:border-white/10 md:pl-4">Activity</div>
		<div class="text-right md:border-l md:border-white/10 md:pl-4">Distance</div>
		<div class="text-right md:border-l md:border-white/10 md:pl-4">Pace</div>
		<div class="text-right md:border-l md:border-white/10 md:pl-4">Time/Status</div>
	</div>

	<!-- List Rows -->
	<div class="flex flex-col">
		{#each rows as row, i}
			<LeaderboardRow {row} index={i} />
		{/each}

		<!-- Empty State if no runners -->
		{#if rows.length === 0}
			<EmptyState
				title="No participants yet."
				message="Be the first to toe the line."
				variant={EMPTY_STATE_VARIANT.INLINE}
			/>
		{/if}
	</div>
</div>
