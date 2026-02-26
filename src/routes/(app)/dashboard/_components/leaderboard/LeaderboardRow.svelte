<script lang="ts">
	import { formatDate } from '$lib/utils/datetime.js';
	import { formatResultDisplay } from '$lib/utils/challenge.js';
	import { formatDistanceDisplay } from '$lib/utils/distance.js';
	import { PACE_UNIT_LABEL } from '$lib/constants';
	import { fly } from 'svelte/transition';
	import type { LeaderboardRowData } from '$lib/types/dashboard.js';
	import { getDashboardContext } from '../../_logic/context.js';

	type Props = {
		row: LeaderboardRowData;
		index: number;
	};

	let { row, index }: Props = $props();

	const dashboard = getDashboardContext();
	const challenge = $derived(dashboard.selectedChallenge);
	const unit = $derived(dashboard.distanceUnit);
	const goalDistanceDisplay = $derived(
		challenge?.goalDistance ? formatDistanceDisplay(challenge.goalDistance, unit) : null
	);
	const resultDisplay = $derived(formatResultDisplay(row.participant.resultTime));

	// Helper function for status color
	const getStatusColor = (status: string | null) => {
		switch (status) {
			case 'completed':
				return 'text-(--accent-lime)';
			case 'in_progress':
				return 'text-blue-400 animate-pulse';
			case 'dnf':
			case 'did_not_finish':
				return 'text-red-500 line-through opacity-50';
			default:
				return 'text-gray-500';
		}
	};

	function getMobileStatusLabel(status: string | null, display: string): string {
		if (status === 'completed') return display;
		if (status === 'did_not_finish') return 'DNF';
		if (status === 'in_progress') return 'In progress';
		return display || status || '--';
	}
</script>

<div
	class="group relative flex flex-col gap-3 overflow-hidden rounded-lg border border-white/5 bg-black/20 px-4 py-4 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] md:grid md:grid-cols-[50px_2fr_1fr_1fr_1fr_1fr] md:grid-rows-1 md:gap-4 md:py-6 md:[grid-template-areas:'rank_athlete_activity_distance_pace_time']"
	in:fly={{ y: 20, delay: index * 50 }}
>
	<!-- Rank Badge with Glow for Top 3 -->
	{#if row.rank && row.rank <= 3}
		<div
			class="absolute top-0 left-0 h-full w-1 bg-(--accent-lime) shadow-[0_0_10px_var(--accent-lime)]"
		></div>
	{/if}

	<!-- Row 1 (mobile): rank + avatar + name. On desktop: children flow into grid -->
	<div class="flex items-center gap-3 md:contents">
		<!-- Enhanced Rank Display -->
		<div
			class="flex items-center justify-center font-mono text-lg font-black [grid-area:rank] {row.rank ===
			1
				? 'text-(--accent-lime) drop-shadow-[0_0_10px_var(--accent-lime)]'
				: 'text-gray-600'}"
		>
			{row.rank || '-'}
		</div>

		<!-- Athlete Info -->
		<div
			class="flex min-w-0 flex-1 items-center gap-4 [grid-area:athlete] md:border-l md:border-white/10 md:pl-4"
		>
			<!-- Enhanced Avatar with Glow -->
			<div
				class="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-gray-800 shadow-lg transition-all group-hover:border-(--accent-lime)/50 group-hover:shadow-[0_0_20px_rgba(0,255,0,0.3)]"
			>
				<img
					src={`https://ui-avatars.com/api/?name=${row.profile.firstname}+${row.profile.lastname}&background=random&color=fff`}
					alt={row.profile.firstname}
					class="h-full w-full object-cover"
				/>
				<!-- Status Ring with Pulse Animation -->
				{#if row.participant.status === 'in_progress'}
					<div
						class="absolute inset-0 animate-pulse rounded-full border-2 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
					></div>
				{/if}
			</div>
			<div class="min-w-0 flex-1">
				<!-- Athlete Name - MUST link to Strava -->
				{#if row.profile.stravaAthleteId}
					<a
						href={`https://strava.com/athletes/${row.profile.stravaAthleteId}`}
						target="_blank"
						rel="noopener noreferrer"
						class="block truncate text-base font-bold tracking-tight text-white underline decoration-orange-500 decoration-2 underline-offset-2 transition-colors hover:text-(--accent-lime)"
						style="color: #FC5200;"
					>
						{row.profile.firstname}
						{row.profile.lastname}
					</a>
				{:else}
					<span class="block truncate text-base font-bold tracking-tight text-white">
						{row.profile.firstname}
						{row.profile.lastname}
					</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Row 2 (mobile): distance | time. On desktop: children flow into grid -->
	<div class="flex items-center justify-between gap-4 md:contents">
		<!-- Distance -->
		<div
			class="flex flex-col items-end justify-center [grid-area:distance] md:border-l md:border-white/10 md:pl-4"
		>
			<span class="font-mono font-bold text-white">
				{#if goalDistanceDisplay}
					{goalDistanceDisplay}
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

		<!-- Pace (Placeholder / Calc) - Desktop only -->
		<div
			class="hidden flex-col items-end justify-center [grid-area:pace] md:flex md:border-l md:border-white/10 md:pl-4"
		>
			<span class="font-mono text-sm text-gray-300">-- {PACE_UNIT_LABEL[unit]}</span>
		</div>

		<!-- Time/Status -->
		<div
			class="flex flex-col items-end justify-center text-right [grid-area:time] md:border-l md:border-white/10 md:pl-4"
		>
			{#if row.participant.status === 'completed'}
				<span class="font-mono text-xl font-bold text-white">{resultDisplay}</span>
				<span class="font-mono text-[10px] tracking-wider text-(--accent-lime) uppercase"
					>Official</span
				>
			{:else}
				<span
					class="font-mono text-sm font-bold uppercase {getStatusColor(row.participant.status)}"
				>
					{getMobileStatusLabel(row.participant.status, resultDisplay)}
				</span>
				{#if resultDisplay !== '--'}
					<span class="font-mono text-[10px] tracking-wider text-gray-500 uppercase">
						{resultDisplay}
					</span>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Activity Name (Desktop) - MUST link to Strava with "View on Strava" text -->
	<div
		class="hidden flex-col justify-center [grid-area:activity] md:flex md:border-l md:border-white/10 md:pl-4"
	>
		{#if row.contribution?.stravaActivityId}
			<span class="truncate font-mono text-xs text-white/80 uppercase">
				{row.contribution.activityName || 'No Data'}
			</span>
			<a
				href={`https://strava.com/activities/${row.contribution.stravaActivityId}`}
				target="_blank"
				rel="noopener noreferrer"
				class="mt-1 font-mono text-[10px] font-bold uppercase underline decoration-orange-500 decoration-2 underline-offset-2 transition-colors hover:text-white"
				style="color: #FC5200;"
			>
				View on Strava
			</a>
			<span class="mt-0.5 text-[10px] text-gray-600">
				{formatDate(row.contribution.occurredAt)}
			</span>
		{:else}
			<span class="truncate font-mono text-xs text-white/80 uppercase">No Data</span>
		{/if}
	</div>
</div>
