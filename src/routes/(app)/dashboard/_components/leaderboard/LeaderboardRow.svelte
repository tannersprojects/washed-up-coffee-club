<script lang="ts">
	import { formatDate } from '$lib/utils/datetime.js';
	import { PARTICIPANT_STATUS, type ParticipantStatus } from '$lib/constants';
	import { idToHexColor } from '$lib/utils/avatar.js';
	import { fly } from 'svelte/transition';
	import type { LeaderboardRowData } from '$lib/types/dashboard.js';

	type Props = {
		row: LeaderboardRowData;
		index: number;
	};

	let { row, index }: Props = $props();

	const status = $derived(row.participant.status ?? null);
	const isCompleted = $derived(status === PARTICIPANT_STATUS.COMPLETED);
	const isInProgress = $derived(status === PARTICIPANT_STATUS.IN_PROGRESS);
	const isDnf = $derived(status === PARTICIPANT_STATUS.DID_NOT_FINISH);

	function getStatusLabel(s: ParticipantStatus | null): string | null {
		switch (s) {
			case PARTICIPANT_STATUS.IN_PROGRESS:
				return 'In progress';
			case PARTICIPANT_STATUS.DID_NOT_FINISH:
				return 'DNF';
			case PARTICIPANT_STATUS.REGISTERED:
				return 'Registered';
			default:
				return null;
		}
	}

	const statusLabel = $derived(getStatusLabel(status));
</script>

<div
	class="group relative flex flex-col gap-3 overflow-hidden rounded-lg border border-white/5 bg-black/20 px-4 py-4 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
	class:opacity-50={isDnf}
	in:fly={{ y: 20, delay: index * 50 }}
>
	{#if row.rank && row.rank <= 3}
		<div
			class="absolute top-0 left-0 h-full w-1 bg-(--accent-lime) shadow-[0_0_10px_var(--accent-lime)]"
		></div>
	{/if}

	<!-- Header row: rank + athlete + primary value -->
	<div class="flex flex-wrap items-start gap-x-3 gap-y-2">
		<div
			class="flex w-8 shrink-0 items-center justify-center font-mono text-lg font-black {row.rank ===
			1
				? 'text-(--accent-lime) drop-shadow-[0_0_10px_var(--accent-lime)]'
				: 'text-gray-600'}"
		>
			{row.rank ?? '-'}
		</div>

		<div class="flex min-w-0 flex-1 items-center gap-3">
			<div
				class="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-gray-800 shadow-lg transition-all group-hover:border-(--accent-lime)/50 group-hover:shadow-[0_0_20px_rgba(0,255,0,0.3)] sm:h-12 sm:w-12"
			>
				<img
					src={`https://ui-avatars.com/api/?name=${row.profile.firstname}+${row.profile.lastname}&background=${idToHexColor(row.profile.id)}&color=fff`}
					alt={row.profile.firstname}
					class="h-full w-full object-cover"
				/>
				{#if isInProgress}
					<div
						class="absolute inset-0 animate-pulse rounded-full border-2 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
					></div>
				{/if}
			</div>

			<div class="min-w-0 flex-1">
				{#if row.profile.stravaAthleteId}
					<a
						href={`https://strava.com/athletes/${row.profile.stravaAthleteId}`}
						target="_blank"
						rel="noopener noreferrer"
						class="block truncate text-base font-bold tracking-tight underline decoration-orange-500 decoration-2 underline-offset-2 transition-colors hover:text-(--accent-lime)"
						class:line-through={isDnf}
						style="color: #FC5200;"
					>
						{row.profile.firstname}
						{row.profile.lastname}
					</a>
				{:else}
					<span
						class="block truncate text-base font-bold tracking-tight text-white"
						class:line-through={isDnf}
					>
						{row.profile.firstname}
						{row.profile.lastname}
					</span>
				{/if}
				{#if statusLabel}
					<span
						class="mt-0.5 block font-mono text-[10px] tracking-widest uppercase {isInProgress
							? 'text-blue-400'
							: isDnf
								? 'text-red-500'
								: 'text-gray-500'}"
					>
						{statusLabel}
					</span>
				{/if}
			</div>
		</div>

		<div
			class="order-last flex basis-full flex-row items-baseline justify-start gap-2 pl-11 sm:order-0 sm:basis-auto sm:flex-col sm:items-end sm:justify-start sm:gap-0 sm:pl-0 sm:text-right"
		>
			<span
				class="font-mono text-lg font-bold sm:text-xl {isCompleted
					? 'text-white'
					: isDnf
						? 'text-red-500 line-through'
						: 'text-white/80'}"
			>
				{row.primaryValue}
			</span>
			{#if row.primaryLabel}
				<span
					class="font-mono text-[10px] tracking-widest whitespace-nowrap uppercase {isCompleted
						? 'text-(--accent-lime)'
						: 'text-gray-500'}"
				>
					{row.primaryLabel}
				</span>
			{/if}
		</div>
	</div>

	{#if row.secondaryLine}
		<div
			class="flex flex-wrap items-center gap-x-2 gap-y-1 pl-11 font-mono text-xs text-gray-400"
		>
			{row.secondaryLine}
		</div>
	{/if}

	<!-- Activity line (highlight contribution) -->
	{#if row.contribution?.stravaActivityId}
		<div
			class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/5 pt-3 pl-11 font-mono text-[10px] tracking-wider text-gray-500 uppercase"
		>
			<span class="truncate text-white/70">
				{row.contribution.activityName || 'Activity'}
			</span>
			<a
				href={`https://strava.com/activities/${row.contribution.stravaActivityId}`}
				target="_blank"
				rel="noopener noreferrer"
				class="font-bold underline decoration-orange-500 decoration-2 underline-offset-2 transition-colors hover:text-white"
				style="color: #FC5200;"
			>
				View on Strava
			</a>
			<span class="text-gray-600">{formatDate(row.contribution.occurredAt)}</span>
		</div>
	{/if}
</div>
