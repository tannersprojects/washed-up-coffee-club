<script lang="ts">
	import RoutineCard from './RoutineCard.svelte';

	let { routineSchedule, smoothScroll } = $props();

	function reveal(node: HTMLElement) {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						node.classList.add('reveal-active');
						observer.unobserve(node);
					}
				});
			},
			{ threshold: 0.15 }
		);
		observer.observe(node);
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<section class="relative z-10 -mt-80 overflow-hidden bg-[#050505] px-6 py-24 md:mt-0 md:py-48">
	<div
		class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.15] mix-blend-screen select-none"
	>
		<div class="flex w-[150%] rotate-12 flex-col gap-0">
			{#each Array(10) as _, i}
				<div
					class="text-[10vh] leading-[0.85] font-black tracking-tighter whitespace-nowrap text-white/50 uppercase will-change-transform md:text-[10vw]"
					style="transform: translateX({(i % 2 === 0 ? 1 : -1) * (smoothScroll * 0.05)}px);"
				>
					Saturday. Thursday.
				</div>
			{/each}
		</div>
	</div>

	<!-- <div class="absolute top-0 bottom-0 left-4 w-px bg-white/5 md:left-10 md:bg-white/10"></div>
	<div class="absolute top-0 right-4 bottom-0 w-px bg-white/5 md:right-10 md:bg-white/10"></div> -->

	<!-- Top gradient fade -->
	<div
		class="pointer-events-none absolute top-0 left-0 z-20 h-32 w-full bg-linear-to-b from-[#050505] to-transparent"
	></div>

	<div class="relative z-30 mx-auto max-w-6xl">
		<div class="mb-16 flex flex-col justify-between gap-2 pb-4 md:mb-24 md:flex-row md:items-end">
			<h2
				class="text-4xl font-black tracking-tighter text-white uppercase italic md:text-8xl"
				use:reveal
			>
				Weekly Splits
			</h2>
			<span class="font-mono text-xs text-(--accent-lime)">EST. PACING</span>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each routineSchedule as schedule, i}
				<RoutineCard {schedule} index={i} />
			{/each}
		</div>
	</div>
	<div
		class="pointer-events-none absolute bottom-0 left-0 z-20 h-32 w-full bg-linear-to-t from-[#050505] to-transparent"
	></div>
</section>
