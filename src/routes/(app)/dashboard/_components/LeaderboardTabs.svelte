<script lang="ts">
	import { getDashboardContext } from '../_logic/context.js';
	import Tabs from '$lib/components/Tabs.svelte';

	const dashboard = getDashboardContext();
	const challenge = $derived(dashboard.selectedChallenge);
	const activeTab = $derived(challenge?.activeTab ?? 'leaderboard');

	const tabs = [
		{ value: 'leaderboard', label: 'Leaderboard' },
		{ value: 'details', label: 'Details' }
	];

	function handleSelect(value: string) {
		challenge?.setActiveTab(value as 'leaderboard' | 'details');
	}
</script>

<Tabs tabs={tabs} value={activeTab} onSelect={handleSelect} class="mb-8" />
