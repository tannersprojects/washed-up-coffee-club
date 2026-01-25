<script lang="ts">
	import { getDashboardUI } from '../_logic/DashboardUI.svelte';

	let dashboard = getDashboardUI();
	let activeTab = $derived(dashboard.activeTab);
</script>

<div class="mb-8 flex border-b border-white/10">
	<button
		class="border-b-2 px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors {activeTab ===
		'leaderboard'
			? 'border-(--accent-lime) text-white'
			: 'border-transparent text-gray-500 hover:text-white'}"
		onclick={() => dashboard.handleTabChange('leaderboard')}
	>
		Leaderboard
	</button>
	<button
		class="border-b-2 px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors {activeTab ===
		'details'
			? 'border-(--accent-lime) text-white'
			: 'border-transparent text-gray-500 hover:text-white'}"
		onclick={() => dashboard.handleTabChange('details')}
	>
		Details
	</button>
</div>
