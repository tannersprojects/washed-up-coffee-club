<script lang="ts">
	import { getDashboardContext } from '../_logic/context.js';
	import ChallengeCard from './ChallengeCard.svelte';

	let dashboard = getDashboardContext();
	let challenges = $derived(dashboard.challenges);
	let leaderboards = $derived(dashboard.leaderboards);
	let selectedChallengeId = $derived(dashboard.selectedChallengeId);

	function onSelectChallenge(id: string) {
		dashboard.selectChallenge(id);
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-8">
	<h2 class="mb-6 text-3xl font-black tracking-tight text-white uppercase">Active Challenges</h2>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each challenges as challenge (challenge.id)}
			{@const leaderboard = leaderboards[challenge.id]}
			{#if leaderboard}
				<ChallengeCard
					{challenge}
					{leaderboard}
					isSelected={challenge.id === selectedChallengeId}
					onSelect={onSelectChallenge}
				/>
			{/if}
		{/each}
	</div>
</div>
