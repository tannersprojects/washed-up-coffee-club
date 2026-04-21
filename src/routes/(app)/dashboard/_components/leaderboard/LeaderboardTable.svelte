<script lang="ts">
	import { getDashboardContext } from '../../_logic/context.js';
	import LeaderboardRow from './LeaderboardRow.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import {
		CHALLENGE_TYPE,
		EMPTY_STATE_VARIANT,
		RANKING_METRIC,
		RANKING_METRIC_SHORT_LABEL
	} from '$lib/constants';

	const dashboard = getDashboardContext();
	let challenge = $derived(dashboard.selectedChallenge);
	let leaderboard = $derived(challenge?.leaderboard);
	let rows = $derived(leaderboard?.leaderboardRows || []);

	let rankedByLabel = $derived.by(() => {
		if (!challenge) return null;
		if (challenge.rankingMetric === RANKING_METRIC.NONE) {
			if (challenge.type === CHALLENGE_TYPE.CUMULATIVE) return 'Total distance';
			if (challenge.type === CHALLENGE_TYPE.BEST_EFFORT) return 'Longest run';
			return 'Segment time';
		}
		return RANKING_METRIC_SHORT_LABEL[challenge.rankingMetric];
	});
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-3">
	{#if rankedByLabel}
		<div
			class="flex items-center justify-end px-1 font-mono text-[10px] tracking-widest text-gray-500 uppercase"
		>
			<span class="text-gray-600">Ranked by:</span>
			<span class="ml-2 text-(--accent-lime)">{rankedByLabel}</span>
		</div>
	{/if}

	<div class="flex flex-col gap-2">
		{#each rows as row, i}
			<LeaderboardRow {row} index={i} />
		{/each}

		{#if rows.length === 0}
			<EmptyState
				title="No participants yet."
				message="Be the first to toe the line."
				variant={EMPTY_STATE_VARIANT.INLINE}
			/>
		{/if}
	</div>
</div>
