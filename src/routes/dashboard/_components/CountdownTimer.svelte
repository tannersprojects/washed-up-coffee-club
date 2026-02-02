<script lang="ts">
	import { getDashboardContext } from '../_logic/context.js';

	let dashboard = getDashboardContext();
</script>

{#if dashboard.selectedChallenge}
	<div class="flex flex-col items-start">
		<span class="mb-0.5 font-mono text-[10px] tracking-[0.2em] text-gray-400 uppercase">
			Time Remaining
		</span>
		<div class="font-mono text-2xl font-bold tracking-[0.15em] text-white tabular-nums md:text-3xl">
			{dashboard.selectedChallenge.timeLeft}
		</div>
	</div>
{/if}
