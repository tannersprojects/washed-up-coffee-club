<script lang="ts">
	let { memories, innerHeight, innerWidth } = $props();

	let cameraRollSection: HTMLElement | null = $state(null);
	let cameraRollProgress = $state(0);

	// Precise width measurements for scroll math
	let trackWidth = $state(0);
	let maskWidth = $state(0);

	// Update scroll progress relative to this specific section
	$effect(() => {
		if (!cameraRollSection) return;

		const update = () => {
			const rect = cameraRollSection?.getBoundingClientRect() ?? { height: 0, top: 0 };
			// Effective scroll distance is the total height minus one viewport
			// (Since sticky takes up one viewport)
			const scrollDistance = rect.height - innerHeight;
			const scrolledInto = -rect.top;

			// Normalize 0 to 1
			if (scrollDistance > 0) {
				cameraRollProgress = Math.min(Math.max(scrolledInto / scrollDistance, 0), 1);
			} else {
				cameraRollProgress = 0;
			}
		};

		window.addEventListener('scroll', update);
		return () => window.removeEventListener('scroll', update);
	});
</script>

<div bind:this={cameraRollSection} class="relative h-[300dvh] w-full bg-[#050505]">
	<!-- Sticky Container: Locks the view in place while we scroll through the 300dvh height -->
	<!-- ALWAYS VERTICAL STACK (flex-col) -->
	<div class="sticky top-0 flex h-dvh w-full flex-col overflow-hidden">
		<!-- Top/Bottom Fades (Global) -->
		<div
			class="pointer-events-none absolute top-0 left-0 z-30 h-32 w-full bg-linear-to-b from-[#050505] to-transparent"
		></div>
		<div
			class="pointer-events-none absolute bottom-0 left-0 z-30 h-32 w-full bg-linear-to-t from-[#050505] to-transparent"
		></div>

		<!-- Background Lines -->
		<div
			class="pointer-events-none absolute inset-0 flex h-full w-full flex-col justify-between opacity-20"
		>
			{#each Array(5) as _}
				<div class="h-px w-full bg-white/20"></div>
			{/each}
		</div>

		<!-- TITLE SECTION -->
		<!-- Always top, full width -->
		<div
			class="relative z-20 flex w-full shrink-0 flex-col justify-center px-6 pt-16 md:pt-24 md:pl-20"
		>
			<h3 class="mb-2 font-mono text-xs font-bold tracking-widest text-(--accent-lime) uppercase">
				// Evidence
			</h3>
			<h2
				class="text-6xl font-black tracking-tighter text-white uppercase italic md:text-6xl lg:text-7xl xl:text-8xl"
			>
				Photo Finish
			</h2>
		</div>

		<!-- IMAGES SECTION -->
		<!-- Always below title, takes remaining height -->
		<!-- Added justify-start to ensure content aligns left initially -->
		<div
			class="relative z-10 flex flex-1 items-start justify-start overflow-hidden pt-12 pl-6 md:items-center md:pt-0 md:pl-0"
			bind:clientWidth={maskWidth}
		>
			<!-- Track with precise JS-based transform -->
			<div
				class="flex w-max items-center gap-4 will-change-transform md:gap-8"
				bind:clientWidth={trackWidth}
				style="transform: translateX(-{cameraRollProgress * (trackWidth - maskWidth)}px);"
			>
				<!-- Spacer for visual breathing room on start -->
				<div class="w-4 shrink-0 md:w-20"></div>

				{#each memories as memory, i}
					<div
						class="group relative flex shrink-0 rotate-(--angle) flex-col bg-white p-2 shadow-xl transition-all duration-500 hover:z-50 hover:scale-105 hover:rotate-0 md:p-3"
						style="--angle: {(i % 2 === 0 ? 1 : -1) * (((i * 3) % 4) + 1)}deg;"
					>
						<div
							class="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-black/20"
						></div>

						<!-- Image Container -->
						<div
							class="relative h-[35vh] w-[28vh] overflow-hidden bg-gray-200 lg:h-[50vh] lg:w-[40vh]"
						>
							<img src={memory.src} alt="Memory" class="h-full w-full object-cover" />
						</div>

						<div class="mt-3 flex items-end justify-between">
							<p
								class="max-w-[120px] truncate font-mono text-[10px] font-bold tracking-widest text-black uppercase lg:max-w-[200px]"
							>
								{memory.caption}
							</p>
							<p class="font-mono text-[10px] text-gray-400">0{i + 1}</p>
						</div>
					</div>
				{/each}

				<!-- End Spacer -->
				<div class="w-10 shrink-0 md:w-40"></div>
			</div>
		</div>
	</div>
</div>
