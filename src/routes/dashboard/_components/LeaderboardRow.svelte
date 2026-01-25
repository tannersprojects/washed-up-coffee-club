<script lang="ts">
	import { formatDate } from '$lib/utils/date-utils.js';
	import { fly } from 'svelte/transition';
	import type { LeaderboardRow } from '$lib/types/dashboard.js';
	import { getDashboardUI } from '../_logic/DashboardUI.svelte.js';

	type Props = {
		row: LeaderboardRow;
		index: number;
	};

	let { row, index }: Props = $props();

	const dashboard = getDashboardUI();
	const challenge = $derived(dashboard.selectedChallenge);

	// Helper function for status color
	const getStatusColor = (status: string | null) => {
		switch (status) {
			case 'completed':
				return 'text-(--accent-lime)';
			case 'in_progress':
				return 'text-blue-400 animate-pulse';
			case 'dnf':
				return 'text-red-500 line-through opacity-50';
			default:
				return 'text-gray-500';
		}
	};
</script>

<div
	class="group grid grid-cols-[30px_1fr_1fr_auto] items-center gap-4 border-b border-white/5 px-4 py-6 transition-colors hover:bg-white/5 md:grid-cols-[50px_2fr_1fr_1fr_1fr_1fr]"
	in:fly={{ y: 20, delay: index * 50 }}
>
	<!-- Rank -->
	<div
		class="text-center font-mono text-lg font-bold {row.rank === 1
			? 'text-(--accent-lime)'
			: 'text-gray-600'}"
	>
		{row.rank || '-'}
	</div>

	<!-- Athlete Info -->
	<div class="flex items-center gap-4">
		<div
			class="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-gray-800"
		>
			<img
				src={`https://ui-avatars.com/api/?name=${row.profile.firstname}+${row.profile.lastname}&background=random&color=fff`}
				alt={row.profile.firstname}
				class="h-full w-full object-cover"
			/>
			{#if row.participant.status === 'in_progress'}
				<div
					class="absolute right-0 bottom-0 h-2.5 w-2.5 animate-pulse rounded-full border border-black bg-blue-500"
				></div>
			{/if}
		</div>
		<div class="flex flex-col">
			<span
				class="max-w-[120px] truncate text-base font-bold tracking-tight text-white transition-colors group-hover:text-(--accent-lime) md:max-w-none"
			>
				{row.profile.firstname}
				{row.profile.lastname}
			</span>
			<!-- Mobile Only: Result Display -->
			<span class="font-mono text-[10px] text-gray-500 uppercase md:hidden"
				>{row.participant.resultDisplay || '--'}</span
			>
		</div>
	</div>

	<!-- Activity Name (Desktop) -->
	<div class="hidden flex-col justify-center md:flex">
		<span class="truncate font-mono text-xs text-white/80 uppercase">
			{row.contribution?.activityName || 'No Data'}
		</span>
		{#if row.contribution}
			<span class="text-[10px] text-gray-600">{formatDate(row.contribution.occurredAt)}</span>
		{/if}
	</div>

	<!-- Distance -->
	<div class="flex flex-col items-end justify-center">
		<span class="font-mono font-bold text-white">
			{#if challenge?.goalValue}
				{(challenge.goalValue / 1000).toFixed(1)}
				<span class="text-[10px] text-gray-500">KM</span>
			{:else}
				--
			{/if}
		</span>
		<!-- Simple Progress Bar -->
		<div class="mt-2 h-1 w-full max-w-[80px] overflow-hidden rounded-full bg-gray-800">
			<div
				class="h-full bg-(--accent-lime) transition-all duration-1000"
				style="width: {row.participant.status === 'completed' ? '100%' : '0%'}"
			></div>
		</div>
	</div>

	<!-- Pace (Placeholder / Calc) -->
	<div class="hidden flex-col items-end justify-center md:flex">
		<span class="font-mono text-sm text-gray-300">-- /km</span>
	</div>

	<!-- Time/Status -->
	<div class="flex flex-col items-end justify-center text-right">
		{#if row.participant.status === 'completed'}
			<span class="font-mono text-xl font-bold text-white">{row.participant.resultDisplay}</span>
			<span class="font-mono text-[10px] tracking-wider text-(--accent-lime) uppercase"
				>Official</span
			>
		{:else}
			<span class="font-mono text-sm font-bold uppercase {getStatusColor(row.participant.status)}"
				>{row.participant.status}</span
			>
			<span class="font-mono text-[10px] tracking-wider text-gray-500 uppercase">
				{row.participant.resultDisplay || '--'}
			</span>
		{/if}
	</div>
</div>
