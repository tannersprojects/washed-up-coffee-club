<script lang="ts">
	type Tab = 'leaderboard' | 'details';

	type Props = {
		activeTab: Tab;
		onTabChange: (tab: Tab) => void;
	};

	let { activeTab, onTabChange }: Props = $props();
</script>

<div class="mb-8 flex border-b border-white/10">
	<button
		class="border-b-2 px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors {activeTab ===
		'leaderboard'
			? 'border-(--accent-lime) text-white'
			: 'border-transparent text-gray-500 hover:text-white'}"
		onclick={() => onTabChange('leaderboard')}
	>
		Leaderboard
	</button>
	<button
		class="border-b-2 px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors {activeTab ===
		'details'
			? 'border-(--accent-lime) text-white'
			: 'border-transparent text-gray-500 hover:text-white'}"
		onclick={() => onTabChange('details')}
	>
		Details
	</button>
</div>
