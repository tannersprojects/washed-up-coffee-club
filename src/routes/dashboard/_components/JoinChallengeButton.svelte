<script lang="ts">
	import { isChallengeJoinable } from '$lib/utils/challenge-utils.js';
	import { getDashboardUI } from '../_logic/DashboardUI.svelte.js';

	let dashboard = getDashboardUI();
	let challenge = $derived(dashboard.selectedChallenge);
	let isSubmitting = $derived(dashboard.isSubmitting);
	let joinable = $derived(isChallengeJoinable(challenge));
</script>

<div class="flex">
	{#if challenge?.isParticipating}
		<div
			class="flex rounded-full border border-(--accent-lime)/30 bg-(--accent-lime)/10 px-4 py-2 text-sm font-bold tracking-widest text-(--accent-lime) uppercase"
		>
			You're In!
		</div>
	{:else if joinable}
		<button
			type="submit"
			disabled={isSubmitting}
			class="flex rounded-full border border-(--accent-lime) bg-(--accent-lime) px-6 py-3 text-sm font-bold tracking-widest text-black uppercase transition-colors hover:bg-(--accent-lime)/90 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{isSubmitting ? 'Joining...' : 'Join Challenge'}
		</button>
	{:else}
		<div
			class="flex rounded-full border border-gray-600 bg-gray-800/50 px-4 py-2 text-sm font-bold tracking-widest text-gray-500 uppercase"
		>
			Challenge Ended
		</div>
	{/if}
</div>
