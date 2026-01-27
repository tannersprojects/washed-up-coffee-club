<script lang="ts">
	import { getDashboardContext } from '../_logic/context.js';

	let dashboard = getDashboardContext();
	let challenge = $derived(dashboard.selectedChallenge);
	let leaderboard = $derived(challenge?.leaderboard);
	let stats = $derived(leaderboard?.stats);

	const statItems = $derived([
		{ label: 'Runners', value: stats?.totalRunners },
		{ label: 'Finished', value: stats?.finishers },
		{ label: 'On Course', value: stats?.activeRunners },
		{ label: 'Total KM', value: stats?.totalDistanceKm }
	]);
</script>

{#if stats}
	<div class="mt-12 grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-4">
		{#each statItems as stat}
			<div
				class="group flex flex-col items-center justify-center bg-[#050505] p-6 transition-colors hover:bg-white/5"
			>
				<span class="mb-2 font-mono text-[10px] tracking-widest text-gray-500 uppercase"
					>{stat.label}</span
				>
				<span
					class="text-2xl font-bold text-white transition-colors group-hover:text-(--accent-lime)"
					>{stat.value}</span
				>
			</div>
		{/each}
	</div>
{/if}
