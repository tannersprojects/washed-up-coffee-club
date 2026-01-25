<script lang="ts">
	import type { ChallengeUI } from '../_logic/ChallengeUI.svelte.js';
	import type { LeaderboardUI } from '../_logic/LeaderboardUI.svelte.js';

	interface Props {
		challenge: ChallengeUI;
		leaderboard: LeaderboardUI;
		isSelected: boolean;
		onSelect: (id: string) => void;
	}

	let { challenge, leaderboard, isSelected, onSelect }: Props = $props();
</script>

<button
	type="button"
	class="w-full text-left p-6 rounded-lg border-2 transition-all hover:border-[--accent-lime] {isSelected
		? 'border-[--accent-lime] bg-[--accent-lime]/10'
		: 'border-neutral-800 bg-neutral-900/50'}"
	onclick={() => onSelect(challenge.id)}
>
	<!-- Challenge Title and Status -->
	<div class="flex items-start justify-between gap-4 mb-3">
		<h3 class="text-xl font-bold text-white uppercase tracking-tight">
			{challenge.title}
		</h3>

		<!-- Participation Badge -->
		{#if challenge.isParticipating}
			<span
				class="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold uppercase tracking-wider rounded-full border border-green-500/30"
			>
				You're In!
			</span>
		{:else}
			<span
				class="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold uppercase tracking-wider rounded-full border border-yellow-500/30"
			>
				Join Now
			</span>
		{/if}
	</div>

	<!-- Countdown Timer (Compact) -->
	<div class="mb-4">
		<p class="text-sm text-neutral-400 mb-1">Time Remaining</p>
		<p class="text-2xl font-mono font-bold text-[--accent-lime]">
			{challenge.timeLeft}
		</p>
	</div>

	<!-- Quick Stats -->
	<div class="grid grid-cols-3 gap-4 text-center">
		<div>
			<p class="text-xs text-neutral-400 mb-1">Runners</p>
			<p class="text-lg font-bold text-white">{leaderboard.totalRunners}</p>
		</div>
		<div>
			<p class="text-xs text-neutral-400 mb-1">Finished</p>
			<p class="text-lg font-bold text-white">{leaderboard.finishers}</p>
		</div>
		<div>
			<p class="text-xs text-neutral-400 mb-1">Distance</p>
			<p class="text-lg font-bold text-white">{leaderboard.totalDistanceKm}</p>
		</div>
	</div>
</button>
