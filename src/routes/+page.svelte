<script lang="ts">
	import { Spring } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	// Replace these with your actual import paths
	import stravaConnectButton from '$lib/assets/1.1 Connect with Strava Buttons/Connect with Strava Orange/btn_strava_connect_with_orange.svg';
	import whiteStravaConnectButton from '$lib/assets/1.1 Connect with Strava Buttons/Connect with Strava White/btn_strava_connect_with_white.svg';
	import doHardThings from '$lib/assets/images/doHardThings.jpg';
	import community from '$lib/assets/images/theCommunity3.jpg';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { AUTH_ERROR_MESSAGES } from '$lib/constants/auth';

	// --- PROPS & STATE ---
	let { data } = $props();
	let isLoggedIn = $derived(!!data.session);
	let memories = $derived(data.memories || []);
	let routineSchedule = $derived(data.routineSchedules || []);

	// Window binding state
	let innerHeight = $state(0);
	let innerWidth = $state(0);
	let scrollY = $state(0);

	// Derived dimensions for responsive logic
	let isMobile = $derived(innerWidth < 768);

	// Element bindings
	let cameraRollSection: HTMLElement;
	let cameraRollProgress = $state(0);

	// Check for authentication errors
	$effect(() => {
		const error = page.url.searchParams.get('error');
		if (error) {
			const message = AUTH_ERROR_MESSAGES[error] || AUTH_ERROR_MESSAGES.unknown;
			toast.error('Authentication Failed', {
				description: message,
				duration: 5000
			});
			goto('/', { replaceState: true });
		}
	});

	// Spring Physics for Scroll - slightly stiffer on mobile for better responsiveness
	const smoothScroll = new Spring(0, {
		stiffness: 0.1,
		damping: 0.25
	});

	$effect(() => {
		smoothScroll.target = scrollY;
		updateCameraRoll();
	});

	// --- ACTIONS & LOGIC ---

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
			{ threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
		);
		observer.observe(node);
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	function updateCameraRoll() {
		if (!cameraRollSection) return;
		const rect = cameraRollSection.getBoundingClientRect();
		const sectionHeight = rect.height;
		// Use innerHeight state to ensure we react to resizing
		const scrollDistance = sectionHeight - innerHeight;
		const scrolledInto = -rect.top;

		if (scrolledInto >= 0 && scrolledInto <= scrollDistance) {
			cameraRollProgress = scrolledInto / scrollDistance;
		} else if (scrolledInto < 0) {
			cameraRollProgress = 0;
		} else if (scrolledInto > scrollDistance) {
			cameraRollProgress = 1;
		}
	}

	// --- TRACK MORPHING LOGIC ---
	let trackPath = $state<SVGPathElement | null>(null);
	let trackLength = $state(0);

	// 1. Calculate Morph Progress
	let morphProgress = $derived(
		Math.min(1, Math.max(0, smoothScroll.current / (isMobile ? 200 : 300)))
	);

	// 2. Helper for linear interpolation
	const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

	// 3. Define the Shape Coordinates dynamically
	let trackD = $derived.by(() => {
		// Responsive Dimensions for the "Stadium Loop"
		// On mobile, we want the loop to fill the width (5% margins)
		// On desktop, we want it centered (25% margins)
		const marginX = isMobile ? innerWidth * 0.05 : innerWidth * 0.25;
		const topY = isMobile ? innerHeight * 0.45 : innerHeight * 0.55;
		const bottomY = isMobile ? innerHeight * 0.75 : innerHeight * 0.85;

		// STATE A: THE STADIUM LOOP (Responsive)
		const loop = {
			p0: { x: marginX, y: topY },
			c1: { x: marginX, y: innerHeight * 0.25 },
			c2: { x: innerWidth - marginX, y: innerHeight * 0.25 },
			mid: { x: innerWidth - marginX, y: topY },
			c3: { x: innerWidth - marginX, y: bottomY },
			c4: { x: marginX, y: bottomY },
			end: { x: marginX, y: topY }
		};

		// STATE B: THE OPEN WAVE
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

	// 4. Update track length
	$effect(() => {
		trackD;
		if (trackPath) {
			trackLength = trackPath.getTotalLength();
		}
	});
</script>

<svelte:window bind:scrollY bind:innerHeight bind:innerWidth />

<!-- GLOBAL WRAPPER -->
<div
	class="relative w-full bg-[#050505] font-sans text-white selection:bg-(--accent-lime) selection:text-black"
>
	<!-- GLOBAL NOISE OVERLAY -->
	<div
		class="pointer-events-none fixed inset-0 z-50 opacity-[0.08] mix-blend-overlay"
		style="background-image: url('https://grainy-gradients.vercel.app/noise.svg');"
	></div>

	<!-- NAVIGATION -->
	<nav
		class="fixed top-0 z-40 flex w-full items-start justify-between px-6 py-6 transition-all duration-500 {scrollY >
		50
			? 'bg-black/60 shadow-sm backdrop-blur-md'
			: ''}"
	>
		<div class="flex flex-col mix-blend-difference">
			<div class="flex items-center gap-2">
				<div class="h-3 w-3 rounded-full bg-(--accent-lime)"></div>
				<div class="text-sm font-bold tracking-tight text-white uppercase">Washed Up CC</div>
			</div>
			<div
				class="hidden pl-5 font-mono text-[10px] tracking-widest text-gray-400 uppercase sm:block"
			>
				CHS / SC / USA
			</div>
		</div>

		<!-- RIGHT SIDE NAV ACTIONS -->
		<div class="flex items-center gap-6">
			{#if isLoggedIn}
				<button
					class="hidden rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-bold tracking-widest text-white uppercase backdrop-blur-md transition-all hover:border-(--accent-lime) hover:text-(--accent-lime) md:block"
				>
					Leaderboard
				</button>
				<!-- Mobile Icon for Leaderboard -->
				<button class="text-(--accent-lime) md:hidden">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line
							x1="6"
							x2="6"
							y1="20"
							y2="14"
						/></svg
					>
				</button>
			{:else if !isLoggedIn && scrollY < 50}
				<a
					href="/auth/strava/login"
					class="inline-block cursor-pointer transition-opacity duration-300"
					in:fade={{ duration: 300 }}
					out:fade={{ duration: 200 }}
				>
					<img
						src={whiteStravaConnectButton}
						alt="Connect with Strava"
						class="h-8 w-auto md:h-auto md:w-auto"
					/>
				</a>
			{/if}

			<div class="hidden text-right sm:block">
				<div
					class="flex items-center justify-end gap-2 font-mono text-[10px] text-(--frosted-blue)"
				>
					<span class="relative flex h-2 w-2">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--frosted-blue) opacity-75"
						></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-(--frosted-blue)"></span>
					</span>
					PACE: 7:30 / MI
				</div>
			</div>
		</div>
	</nav>

	<!-- SECTION 1: HERO WITH TRACK OVERLAY -->
	<!-- CHANGED: h-screen to h-dvh for better mobile browser support -->
	<section class="relative h-dvh w-full overflow-hidden bg-[#050505]">
		<!-- Top Fade -->
		<div
			class="pointer-events-none absolute top-0 left-0 z-20 h-40 w-full bg-linear-to-b from-[#050505] to-transparent"
		></div>

		<!-- A. IMAGE TEXTURE -->
		<div class="absolute inset-0 z-0 opacity-40 mix-blend-luminosity">
			<img
				src="https://images.unsplash.com/photo-1533560792942-70f3f6120614?q=80&w=2600&auto=format&fit=crop"
				alt="Running Track Texture"
				class="h-full w-full object-cover grayscale"
			/>
		</div>

		<!-- B. BACKGROUND TEXT WALL -->
		<div
			class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.12] mix-blend-screen select-none"
		>
			<div class="flex w-[200%] -rotate-12 flex-col gap-0 md:w-[150%]">
				{#each Array(10) as _, i}
					<div
						class="text-[15vh] leading-[0.85] font-black tracking-tighter whitespace-nowrap text-white uppercase will-change-transform md:text-[10vw]"
						style="transform: translateX({(i % 2 === 0 ? -1 : 1) * smoothScroll.current * 0.08}px);"
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
				{@const p = trackPath.getPointAtLength(Math.min(trackLength, smoothScroll.current * 1.5))}
				<circle cx={p.x} cy={p.y} r="8" fill="var(--accent-lime)" class="opacity-20 blur-sm" />
				<circle cx={p.x} cy={p.y} r="4" fill="var(--accent-lime)" />
				<circle cx={p.x} cy={p.y} r="2" fill="white" />
			{/if}
		</svg>

		<!-- D. HERO CONTENT -->
		<div
			class="relative z-20 flex h-full flex-col items-center justify-center pt-10 md:pt-0"
			style="transform: translateY({smoothScroll.current * 0.3}px); opacity: {1 -
				scrollY / (innerHeight * 0.8)};"
		>
			<div class="relative">
				<!-- CHANGED: Adjusted typography sizing for mobile (text-[14vw]) vs desktop (text-[18vw]) -->
				<h1
					class="-skew-x-12 transform text-center text-[14vw] leading-[0.8] font-black tracking-tighter uppercase italic md:text-[18vw]"
				>
					<span
						class="block bg-linear-to-b from-white via-white to-gray-500 bg-clip-text text-transparent"
						>Run.</span
					>
					<span
						class="ml-[10vw] block bg-linear-to-b from-gray-400 via-gray-600 to-gray-800 bg-clip-text text-transparent"
						>Dip.</span
					>
					<span class="ml-[20vw] block text-(--accent-lime)">Sip.</span>
				</h1>
			</div>

			<div class="absolute bottom-12 flex flex-col items-center gap-2">
				<p class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Start Line</p>
				<div class="h-16 w-px bg-linear-to-b from-gray-500 to-transparent"></div>
			</div>
		</div>

		<!-- Bottom Fade -->
		<div
			class="pointer-events-none absolute bottom-0 left-0 z-20 h-40 w-full bg-linear-to-t from-[#050505] to-transparent"
		></div>
	</section>

	<!-- SECTION 2: MANIFESTO -->
	<section class="relative z-20 mx-auto max-w-4xl px-6 py-24 md:py-40">
		<div use:reveal class="reveal">
			<div class="mb-8 flex items-center gap-4 opacity-50">
				<div class="h-px w-8 bg-white"></div>
				<span class="font-mono text-xs tracking-widest text-white uppercase">The Split</span>
			</div>

			<h2 class="mb-12 text-3xl leading-[1.1] font-medium tracking-tight text-white md:text-6xl">
				We do hard things. <br class="hidden md:block" />We just prefer to do them
				<span
					class="bg-linear-to-r from-(--frosted-blue) to-white bg-clip-text text-transparent italic"
					>together</span
				>.
			</h2>

			<div class="grid gap-12 border-t border-white/10 pt-12 md:grid-cols-2">
				<p class="text-base leading-relaxed font-light text-gray-400 md:text-lg">
					Washed Up Coffee Club is more than just miles. We are a community of friends pushing each
					other to be our best selves. We celebrate the PRs, support through the injuries, and find
					joy in the shared struggle of a hard workout.
				</p>
				<div class="border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
					<p class="mb-2 font-mono text-xs text-(--accent-lime)">CURRENT VIBE</p>
					<p class="text-lg leading-tight font-bold text-white italic md:text-xl">
						"The miles don't get easier. The support just gets stronger."
					</p>
				</div>
			</div>

			<!-- PLACEHOLDER IMAGE GRID -->
			<div class="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
				<div
					class="group relative aspect-[4/3] overflow-hidden rounded-sm border border-white/10 bg-white/5"
				>
					<img
						src={doHardThings}
						alt="Doing hard things"
						class="h-full w-full object-cover opacity-60 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
					/>
					<div class="absolute bottom-4 left-4">
						<span
							class="inline-block bg-(--vintage-grape) px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-white uppercase"
							>The Grind</span
						>
					</div>
				</div>
				<div
					class="group relative aspect-[4/3] overflow-hidden rounded-sm border border-white/10 bg-white/5"
				>
					<img
						src={community}
						alt="Doing things together"
						class="h-full w-full object-cover opacity-60 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
					/>
					<div class="absolute bottom-4 left-4">
						<span
							class="inline-block bg-(--frosted-blue) px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-black uppercase"
							>The Community</span
						>
					</div>
				</div>
			</div>
		</div>

		<!-- Fade Transition -->
		<div
			class="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-linear-to-t from-[#050505] to-transparent"
		></div>
	</section>

	<!-- SECTION 3: CAMERA ROLL (The "Photo Finish") -->
	<!-- CHANGED: h-[300vh] to h-[300dvh] for mobile smoothness -->
	<div bind:this={cameraRollSection} class="relative h-[300dvh] w-full bg-[#050505]">
		<!-- CHANGED: `top-0` sticky container now uses h-dvh. 
         Logic: On mobile, align to bottom (items-end) + padding (pb-24) to keep images visible under the header. 
         On desktop, center them (items-center).
    -->
		<div
			class="sticky top-0 flex h-dvh w-full items-end overflow-hidden pb-24 md:items-center md:pb-0"
		>
			<!-- Top Fade -->
			<div
				class="pointer-events-none absolute top-0 left-0 z-30 h-32 w-full bg-linear-to-b from-[#050505] to-transparent"
			></div>

			<!-- Track Marking Background Lines -->
			<div
				class="pointer-events-none absolute inset-0 flex h-full w-full flex-col justify-between opacity-20"
			>
				{#each Array(5) as _}
					<div class="h-px w-full bg-white/20"></div>
				{/each}
			</div>

			<!-- Title Area -->
			<div
				class="pointer-events-none absolute top-10 left-6 z-20 mix-blend-difference lg:top-20 lg:left-20"
			>
				<h3 class="mb-2 font-mono text-xs font-bold tracking-widest text-(--accent-lime) uppercase">
					// Evidence
				</h3>
				<h2
					class="text-4xl font-black tracking-tighter text-white uppercase italic md:text-5xl lg:text-8xl"
				>
					Photo Finish
				</h2>
			</div>

			<!-- Images Container -->
			<!-- CHANGED: gap adjusted for mobile (gap-4) vs desktop (gap-8) -->
			<div
				class="flex items-center gap-4 pl-6 will-change-transform lg:gap-8 lg:pl-20"
				style="transform: translateX(calc(-1 * {cameraRollProgress} * (100% - 100vw)));"
			>
				{#each memories as memory, i}
					<div
						class="group relative flex shrink-0 rotate-[var(--angle)] flex-col bg-white p-2 shadow-xl transition-all duration-500 hover:z-50 hover:scale-105 hover:rotate-0 md:p-3"
						style="--angle: {(i % 2 === 0 ? 1 : -1) * (((i * 3) % 4) + 1)}deg;"
					>
						<div
							class="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-black/20"
						></div>

						<!-- CHANGED: Adjusted dimensions for mobile to prevent them being too tall -->
						<div
							class="relative h-[40vh] w-[30vh] overflow-hidden bg-gray-200 transition-all duration-500 md:h-[55vh] md:w-[40vh]"
						>
							<img src={memory.src} alt="Memory" class="h-full w-full object-cover" />
						</div>
						<div class="mt-3 flex items-end justify-between">
							<p
								class="max-w-[20vh] truncate font-mono text-[10px] font-bold tracking-widest text-black uppercase"
							>
								{memory.caption}
							</p>
							<p class="font-mono text-[10px] text-gray-400">0{i + 1}</p>
						</div>
					</div>
				{/each}
				<!-- End spacer -->
				<div class="w-10 shrink-0 md:w-40"></div>
			</div>

			<!-- Bottom Fade -->
			<div
				class="pointer-events-none absolute bottom-0 left-0 z-30 h-32 w-full bg-linear-to-t from-[#050505] to-transparent"
			></div>
		</div>
	</div>

	<!-- SECTION 4: THE ROUTINE -->
	<section class="relative z-10 overflow-hidden bg-[#050505] px-6 py-24 md:py-48">
		<!-- Top Fade -->
		<div
			class="pointer-events-none absolute top-0 left-0 z-20 h-32 w-full bg-linear-to-b from-[#050505] to-transparent"
		></div>

		<!-- BACKGROUND TEXT -->
		<div
			class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.15] mix-blend-screen select-none"
		>
			<div class="flex w-[150%] rotate-12 flex-col gap-0">
				{#each Array(10) as _, i}
					<div
						class="text-[10vh] leading-[0.85] font-black tracking-tighter whitespace-nowrap text-white/50 uppercase will-change-transform md:text-[10vw]"
						style="transform: translateX({(i % 2 === 0 ? 1 : -1) *
							(smoothScroll.current * 0.05)}px);"
					>
						Saturday. Thursday.
					</div>
				{/each}
			</div>
		</div>

		<!-- Lane Markers -->
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
						<!-- Lane Number (Hidden on mobile) -->
						<div class="hidden flex-col justify-center md:flex">
							<span class="font-mono text-xs text-gray-600 transition-colors group-hover:text-white"
								>LANE</span
							>
							<span
								class="text-4xl font-black text-white/20 transition-colors group-hover:text-white"
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
							<!-- Mobile lane indicator -->
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

		<!-- Bottom Fade -->
		<div
			class="pointer-events-none absolute bottom-0 left-0 z-20 h-32 w-full bg-linear-to-t from-[#050505] to-transparent"
		></div>
	</section>

	<!-- SECTION 5: FOOTER -->
	<!-- CHANGED: h-dvh for better mobile centering -->
	<section
		class="relative flex h-[80vh] flex-col items-center justify-center overflow-hidden bg-[#050505] md:h-screen"
	>
		<!-- Top Fade -->
		<div
			class="pointer-events-none absolute top-0 left-0 z-20 h-32 w-full bg-linear-to-b from-[#050505] to-transparent"
		></div>

		<div
			class="absolute inset-x-0 bottom-0 h-24 opacity-20"
			style="background-image: repeating-linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333), repeating-linear-gradient(45deg, #333 25%, #050505 25%, #050505 75%, #333 75%, #333); background-position: 0 0, 10px 10px; background-size: 20px 20px;"
		></div>

		<div class="relative z-10 px-4 text-center" use:reveal>
			{#if isLoggedIn}
				<h2
					class="mb-8 text-4xl leading-[0.85] font-black tracking-tighter text-white uppercase italic md:text-9xl"
				>
					Check Your<br /><span
						class="bg-linear-to-r from-(--accent-lime) to-white bg-clip-text text-transparent"
						>Splits</span
					>
				</h2>
			{:else}
				<h2
					class="mb-8 text-4xl leading-[0.85] font-black tracking-tighter text-white uppercase italic md:text-9xl"
				>
					Toe The<br /><span
						class="bg-linear-to-r from-(--vintage-grape) to-white bg-clip-text text-transparent"
						>Line</span
					>
				</h2>
			{/if}

			<div class="mt-8 flex justify-center">
				{#if isLoggedIn}
					<button
						class="group relative flex items-center gap-3 bg-white px-6 py-3 text-base font-bold tracking-wider text-black uppercase transition-all hover:bg-(--accent-lime) md:px-8 md:py-4 md:text-lg"
					>
						View Leaderboard
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="h-5 w-5 transition-transform group-hover:translate-x-1"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
							/>
						</svg>
					</button>
				{:else}
					<a
						href="/auth/strava/login"
						class="inline-block cursor-pointer transition-transform hover:scale-105 active:scale-95"
					>
						<img src={stravaConnectButton} alt="Connect with Strava" class="h-10 w-auto md:h-12" />
					</a>
				{/if}
			</div>
		</div>

		<footer
			class="absolute bottom-8 w-full px-6 text-center font-mono text-[10px] tracking-widest text-white/30 uppercase"
		>
			<div class="flex flex-col items-center justify-center gap-2 md:flex-row md:gap-4">
				<span>EST. 2024</span>
				<span class="hidden md:inline">///</span>
				<span>Charleston, SC</span>
			</div>
		</footer>
	</section>
</div>
