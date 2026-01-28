<script lang="ts">
	import { getDashboardContext } from '../_logic/context.js';

	let dashboard = getDashboardContext();
</script>

{#if dashboard.selectedChallenge}
	<div
		class="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-md"
	>
		<!-- Gradient Overlay -->
		<div
			class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/5 to-transparent"
		></div>

		<div class="relative z-10 flex flex-col items-end">
			<span class="mb-1 font-mono text-[10px] tracking-widest text-gray-500 uppercase"
				>Time Remaining</span
			>
			<div
				class="font-mono text-4xl font-black tracking-widest text-white tabular-nums drop-shadow-lg md:text-5xl"
			>
				{dashboard.selectedChallenge.timeLeft}
			</div>
		</div>
	</div>
{/if}
