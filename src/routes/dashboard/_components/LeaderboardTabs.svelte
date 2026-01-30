<script lang="ts">
	import { getDashboardContext } from '../_logic/context.js';

	let dashboard = getDashboardContext();
	let challenge = $derived(dashboard.selectedChallenge);
	let activeTab = $derived(challenge?.activeTab);
</script>

<div class="mb-8 flex gap-2 border-b border-white/10">
	<button
		class="relative border-b-2 px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all {activeTab ===
		'leaderboard'
			? 'border-(--accent-lime) text-white'
			: 'border-transparent text-gray-500 hover:border-white/30 hover:text-white'}"
		onclick={() => challenge?.setActiveTab('leaderboard')}
	>
		Leaderboard
		{#if activeTab === 'leaderboard'}
			<div
				class="absolute right-0 -bottom-0.5 left-0 h-0.5 bg-(--accent-lime) shadow-[0_0_10px_var(--accent-lime)]"
			></div>
		{/if}
	</button>
	<button
		class="relative border-b-2 px-6 py-3 text-sm font-bold tracking-wider uppercase transition-all {activeTab ===
		'details'
			? 'border-(--accent-lime) text-white'
			: 'border-transparent text-gray-500 hover:border-white/30 hover:text-white'}"
		onclick={() => challenge?.setActiveTab('details')}
	>
		Details
		{#if activeTab === 'details'}
			<div
				class="absolute right-0 -bottom-0.5 left-0 h-0.5 bg-(--accent-lime) shadow-[0_0_10px_var(--accent-lime)]"
			></div>
		{/if}
	</button>
</div>
