<script lang="ts">
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

<section class="relative z-10 overflow-hidden bg-[#050505] px-6 py-24 md:py-48">
	<div
		class="pointer-events-none absolute top-0 left-0 z-20 h-32 w-full bg-linear-to-b from-[#050505] to-transparent"
	></div>

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

	<div class="absolute top-0 bottom-0 left-4 w-px bg-white/5 md:left-10 md:bg-white/10"></div>
	<div class="absolute top-0 right-4 bottom-0 w-px bg-white/5 md:right-10 md:bg-white/10"></div>

	<div class="relative z-10 mx-auto max-w-6xl">
		<div
			class="mb-16 flex flex-col justify-between gap-2 border-b border-white/20 pb-4 md:mb-24 md:flex-row md:items-end"
		>
			<h2
				class="text-4xl font-black tracking-tighter text-white uppercase italic md:text-8xl"
				use:reveal
			>
				Weekly Splits
			</h2>
			<span class="font-mono text-xs text-(--accent-lime)">EST. PACING</span>
		</div>

		<div class="flex flex-col">
			{#each routineSchedule as schedule, i}
				<div
					use:reveal
					class="reveal group relative grid grid-cols-1 gap-4 border-b-2 border-dashed border-white/10 py-8 transition-all hover:border-solid hover:border-white/30 hover:bg-white/5 md:grid-cols-[100px_1fr_auto] md:gap-8 md:py-12"
					style="--accent: {schedule.accentColor}"
				>
					<div class="hidden flex-col justify-center md:flex">
						<span class="font-mono text-xs text-gray-600 transition-colors group-hover:text-white"
							>LANE</span
						>
						<span class="text-4xl font-black text-white/20 transition-colors group-hover:text-white"
							>0{i + 1}</span
						>
					</div>

					<div class="flex flex-col justify-center">
						<h3
							class="text-4xl font-black tracking-tight text-white uppercase italic transition-colors group-hover:text-(--accent) md:text-7xl"
						>
							{schedule.day}
						</h3>
						<p
							class="mt-2 text-lg font-medium text-gray-500 transition-all group-hover:text-white md:text-xl"
						>
							{schedule.description}
						</p>
					</div>

					<div
						class="mt-4 flex flex-row items-center justify-between text-right md:mt-0 md:flex-col md:items-end md:justify-center"
					>
						<span class="font-mono text-xs text-gray-600 md:hidden">LANE 0{i + 1}</span>
						<div class="flex flex-col items-end">
							<div class="inline-flex items-center justify-end gap-2">
								<div class="h-2 w-2 rounded-full bg-(--accent)"></div>
								<span class="font-mono text-2xl font-bold text-white md:text-3xl"
									>{schedule.time}</span
								>
							</div>
							<span
								class="mt-1 font-mono text-xs font-bold tracking-widest text-gray-500 uppercase"
							>
								{schedule.location}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
	<div
		class="pointer-events-none absolute bottom-0 left-0 z-20 h-32 w-full bg-linear-to-t from-[#050505] to-transparent"
	></div>
</section>
