<script lang="ts">
	import { getDashboardContext } from '../_logic/context.js';
	import LeaderboardRowComponent from './LeaderboardRow.svelte';
	import EmptyState from './EmptyState.svelte';

	const dashboard = getDashboardContext();
	let challenge = $derived(dashboard.selectedChallenge);
	let leaderboard = $derived(challenge?.leaderboard);
	let rows = $derived(leaderboard?.leaderboardRows || []);
</script>

<div class="flex flex-col">
	<!-- List Header (hidden on mobile per two-row card layout) -->
	<div
		class="hidden border-b border-white/10 bg-black/20 px-4 py-3 font-mono text-[10px] tracking-widest text-gray-500 uppercase backdrop-blur-sm md:grid md:grid-cols-[50px_2fr_1fr_1fr_1fr_1fr] md:gap-4"
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
		{#each rows as row, i}
			<LeaderboardRowComponent {row} index={i} />
		{/each}

		<!-- Empty State if no runners -->
		{#if rows.length === 0}
			<EmptyState
				title="No participants yet."
				message="Be the first to toe the line."
				variant="no-participants"
			/>
		{/if}
	</div>
</div>
