<script lang="ts">
	import { getDashboardUI } from '../_logic/DashboardUI.svelte';

	let dashboard = getDashboardUI();
	let timeLeft = $derived(dashboard.selectedChallenge?.timeLeft || '00:00:00');
</script>

<div class="flex flex-col items-end">
	<span class="mb-1 font-mono text-[10px] tracking-widest text-gray-500 uppercase"
		>Time Remaining</span
	>
	<div class="font-mono text-4xl font-bold tracking-widest text-white tabular-nums md:text-5xl">
		{timeLeft}
	</div>
</div>
