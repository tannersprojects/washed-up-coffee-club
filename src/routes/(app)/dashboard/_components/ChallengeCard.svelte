<script lang="ts">
	import type { ChallengeUI } from '../_logic/ChallengeUI.svelte.js';

	interface Props {
		challenge: ChallengeUI;
		isSelected: boolean;
		onSelect: (id: string) => void;
	}

	let { challenge, isSelected, onSelect }: Props = $props();
</script>

<button
	type="button"
	class="w-full rounded-lg border-2 p-6 text-left transition-all hover:border-[--accent-lime] {isSelected
		? 'border-[--accent-lime] bg-[--accent-lime]/10'
		: 'border-neutral-800 bg-neutral-900/50'}"
	onclick={() => onSelect(challenge.id)}
>
	<!-- Challenge Title and Status -->
	<div class="mb-3 flex items-start justify-between gap-4">
		<h3 class="text-xl font-bold tracking-tight text-white uppercase">
			{challenge.title}
		</h3>

		<!-- Participation Badge -->
		{#if challenge.isParticipating}
			<span
				class="rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-semibold tracking-wider text-green-400 uppercase"
			>
				You're In!
			</span>
		{:else}
			<span
				class="rounded-full border border-yellow-500/30 bg-yellow-500/20 px-3 py-1 text-xs font-semibold tracking-wider text-yellow-400 uppercase"
			>
				Join Now
			</span>
		{/if}
	</div>

	<!-- Countdown Timer (Compact) -->
	<div class="mb-4">
		<p class="mb-1 text-sm text-neutral-400">Time Remaining</p>
		<p class="font-mono text-2xl font-bold text-[--accent-lime]">
			{challenge.timeLeft}
		</p>
	</div>

	<!-- Quick Stats -->
	<div class="grid grid-cols-3 gap-4 text-center">
		<div>
			<p class="mb-1 text-xs text-neutral-400">Runners</p>
			<p class="text-lg font-bold text-white">{challenge.leaderboard.totalRunners}</p>
		</div>
		<div>
			<p class="mb-1 text-xs text-neutral-400">Finished</p>
			<p class="text-lg font-bold text-white">{challenge.leaderboard.finishers}</p>
		</div>
		<div>
			<p class="mb-1 text-xs text-neutral-400">Distance</p>
			<p class="text-lg font-bold text-white">{challenge.leaderboard.totalDistanceKm}</p>
		</div>
	</div>
</button>
