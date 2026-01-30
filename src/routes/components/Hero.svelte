<script lang="ts">
	let { smoothScroll, scrollY, innerHeight, innerWidth } = $props();

	let isMobile = $derived(innerWidth < 768);

	// --- TRACK MORPHING LOGIC ---
	let trackPath = $state<SVGPathElement | null>(null);
	let trackLength = $state(0);

	let morphProgress = $derived(Math.min(1, Math.max(0, smoothScroll / (isMobile ? 200 : 300))));

	const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

	let trackD = $derived.by(() => {
		// CENTER POINT
		const cx = innerWidth / 2;
		const cy = innerHeight / 2;

		// DIMENSIONS
		// Mobile: 90% width, Height constrained by width to ensure "Track" shape (not vertical oval)
		// Desktop: 50% width, Height based on screen height for grand feel
		let trackW, trackH;

		if (isMobile) {
			trackW = innerWidth * 0.9;
			trackH = trackW * 0.8; // Aspect ratio constraint: Keep it slightly wider than tall or square-ish
		} else {
			trackW = innerWidth * 0.5;
			trackH = innerHeight * 0.6;
		}

		const halfW = trackW / 2;
		const halfH = trackH / 2;

		// SHAPE: CENTERED OVAL (Squircle/Stadium approximation)
		// We use the bounding box defined above to place control points
		const loop = {
			p0: { x: cx - halfW, y: cy },
			c1: { x: cx - halfW, y: cy - halfH }, // Top-Left Control
			c2: { x: cx + halfW, y: cy - halfH }, // Top-Right Control
			mid: { x: cx + halfW, y: cy }, // Right Edge
			c3: { x: cx + halfW, y: cy + halfH }, // Bottom-Right Control
			c4: { x: cx - halfW, y: cy + halfH }, // Bottom-Left Control
			end: { x: cx - halfW, y: cy } // Back to Start
		};

		const line = {
			p0: { x: -100, y: innerHeight * 0.8 },
			c1: { x: innerWidth * 0.2, y: innerHeight * 0.8 },
			c2: { x: innerWidth * 0.4, y: innerHeight * 0.5 },
			mid: { x: innerWidth * 0.5, y: innerHeight * 0.5 },
			c3: { x: innerWidth * 0.6, y: innerHeight * 0.5 },
			c4: { x: innerWidth * 0.8, y: innerHeight * 0.2 },
			end: { x: innerWidth + 100, y: innerHeight * 0.2 }
		};

		const t = morphProgress;

		const curr = {
			p0x: lerp(loop.p0.x, line.p0.x, t),
			p0y: lerp(loop.p0.y, line.p0.y, t),
			c1x: lerp(loop.c1.x, line.c1.x, t),
			c1y: lerp(loop.c1.y, line.c1.y, t),
			c2x: lerp(loop.c2.x, line.c2.x, t),
			c2y: lerp(loop.c2.y, line.c2.y, t),
			midx: lerp(loop.mid.x, line.mid.x, t),
			midy: lerp(loop.mid.y, line.mid.y, t),
			c3x: lerp(loop.c3.x, line.c3.x, t),
			c3y: lerp(loop.c3.y, line.c3.y, t),
			c4x: lerp(loop.c4.x, line.c4.x, t),
			c4y: lerp(loop.c4.y, line.c4.y, t),
			endx: lerp(loop.end.x, line.end.x, t),
			endy: lerp(loop.end.y, line.end.y, t)
		};

		return `M ${curr.p0x},${curr.p0y} C ${curr.c1x},${curr.c1y} ${curr.c2x},${curr.c2y} ${curr.midx},${curr.midy} C ${curr.c3x},${curr.c3y} ${curr.c4x},${curr.c4y} ${curr.endx},${curr.endy}`;
	});

	$effect(() => {
		trackD;
		if (trackPath) trackLength = trackPath.getTotalLength();
	});
</script>

<section class="relative h-dvh min-h-150 w-full overflow-hidden bg-[#050505]">
	<div
		class="pointer-events-none absolute top-0 left-0 z-20 h-40 w-full bg-linear-to-b from-[#050505] to-transparent"
	></div>

	<!-- B. BACKGROUND TEXT WALL -->
	<div
		class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.12] mix-blend-screen select-none"
	>
		<div class="flex w-[200%] -rotate-12 flex-col gap-0 md:w-[150%]">
			{#each Array(10), i (i)}
				<div
					class="text-[15vh] leading-[0.85] font-black tracking-tighter whitespace-nowrap text-white uppercase will-change-transform md:text-[10vw]"
					style="transform: translateX({(i % 2 === 0 ? -1 : 1) * smoothScroll * 0.08}px);"
				>
					Run. Dip. Sip.
				</div>
			{/each}
		</div>
	</div>

	<!-- C. THE TRACK LINE SVG -->
	<svg class="pointer-events-none absolute inset-0 z-10 h-full w-full" preserveAspectRatio="none">
		<path
			bind:this={trackPath}
			d={trackD}
			fill="none"
			stroke="rgba(255,255,255,0.15)"
			stroke-width="2"
			stroke-linecap="round"
		/>
		{#if trackPath}
			{@const p = trackPath.getPointAtLength(Math.min(trackLength, smoothScroll * 1.5))}
			<circle cx={p.x} cy={p.y} r="8" fill="var(--accent-lime)" class="opacity-20 blur-sm" />
			<circle cx={p.x} cy={p.y} r="4" fill="var(--accent-lime)" />
			<circle cx={p.x} cy={p.y} r="2" fill="white" />
		{/if}
	</svg>

	<!-- D. HERO CONTENT -->
	<div
		class="relative z-20 flex h-full flex-col items-center justify-center pt-10 md:pt-0"
		style="transform: translateY({smoothScroll * 0.3}px); opacity: {1 -
			scrollY / (innerHeight * 0.8)};"
	>
		<div class="relative px-4">
			<!-- Added Fluid Typography (clamp) - UPDATED FOR MOBILE PUNCH -->
			<h1
				class="-skew-x-12 transform text-center leading-[0.8] font-black tracking-tighter uppercase italic"
				style="font-size: clamp(8.5rem, 15vw, 16rem);"
			>
				<!-- RUN: White to Grey Olive + Subtle White Glow -->
				<span
					class="block bg-linear-to-b from-white to-(--grey-olive) bg-clip-text text-transparent"
					>Run.</span
				>
				<!-- DIP: Frosted Blue to White + Icy Blue Glow -->
				<span
					class="ml-[4vw] block bg-linear-to-b from-(--frosted-blue) to-white bg-clip-text text-transparent md:ml-[10vw]"
					>Dip.</span
				>
				<!-- SIP: Accent Lime + Intense Electric Glow -->
				<span class="ml-[8vw] block text-(--accent-lime) md:ml-[20vw]">Sip.</span>
			</h1>
		</div>

		<div class="absolute bottom-12 flex flex-col items-center gap-2">
			<p class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Start Line</p>
			<div class="h-16 w-px bg-linear-to-b from-gray-500 to-transparent"></div>
		</div>
	</div>

	<div
		class="pointer-events-none absolute bottom-0 left-0 z-20 h-40 w-full bg-linear-to-t from-[#050505] to-transparent"
	></div>
</section>
