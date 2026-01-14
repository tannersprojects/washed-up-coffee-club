<script lang="ts">
	import { spring } from 'svelte/motion';

	// --- RUNES & STATE ---
	let innerHeight = $state(0);
	let scrollY = $state(0);
	let cameraRollSection: HTMLElement;
	let cameraRollProgress = $state(0);

	// Spring physics for smoother parallax (Apple "weight" feel)
	// stiffness: 0.1 (loose), damping: 0.25 (bouncy but controlled)
	const smoothScroll = spring(0, { stiffness: 0.1, damping: 0.25 });

	// Sync spring with scroll position
	$effect(() => {
		smoothScroll.set(scrollY);
		updateCameraRoll();
	});

	// --- DATA ---
	const memories = [
		{
			id: 1,
			src: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=800&auto=format&fit=crop',
			caption: '06:00 AM // THE PAIN CAVE'
		},
		{
			id: 2,
			src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop',
			caption: 'COFFEE // POST-MORTEM'
		},
		{
			id: 3,
			src: 'https://images.unsplash.com/photo-1533561052669-c61d563d7676?q=80&w=800&auto=format&fit=crop',
			caption: 'SUNDAY // CHURCH'
		},
		{
			id: 4,
			src: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=800&auto=format&fit=crop',
			caption: 'NO ONE SURVIVED'
		},
		{
			id: 5,
			src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
			caption: 'THE COOL DOWN'
		}
	];

	const routineSchedule = [
		{
			id: 1,
			day: 'Saturday',
			time: '06:00 AM',
			location: "Sullivan's Island - Station 30",
			accentColor: 'var(--accent-lime)'
		},
		{
			id: 2,
			day: 'Tuesday',
			time: '05:00 AM',
			location: 'Hampton Park - Moultrie Lot',
			accentColor: 'var(--vintage-grape)'
		}
	];

	// --- ACTIONS & LOGIC ---

	// Intersection Observer for fade-in elements
	function reveal(node: HTMLElement) {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						node.classList.add('reveal-active');
						observer.unobserve(node); // Reveal once, then stay
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

	// Logic to drive the horizontal scroll section
	function updateCameraRoll() {
		if (!cameraRollSection) return;
		const rect = cameraRollSection.getBoundingClientRect();

		// Logic:
		// 1. We want the animation to start when the top of the section hits the top of the viewport.
		// 2. We want it to end when the bottom of the section hits the bottom of the viewport.
		// 3. The scrollable distance is (sectionHeight - windowHeight).

		const sectionHeight = rect.height;
		const scrollDistance = sectionHeight - innerHeight;

		// How many pixels have we scrolled *into* the sticky area?
		// rect.top is positive when below viewport, negative when scrolled past.
		// We want 0 when rect.top is 0.
		const scrolledInto = -rect.top;

		if (scrolledInto >= 0 && scrolledInto <= scrollDistance) {
			cameraRollProgress = scrolledInto / scrollDistance;
		} else if (scrolledInto < 0) {
			cameraRollProgress = 0;
		} else if (scrolledInto > scrollDistance) {
			cameraRollProgress = 1;
		}
	}
</script>

<svelte:window bind:scrollY bind:innerHeight />

<!-- GLOBAL WRAPPER -->
<div
	class="relative w-full bg-[#050505] text-white selection:bg-(--accent-lime) selection:text-black"
>
	<!-- NOISE OVERLAY -->
	<div
		class="pointer-events-none fixed inset-0 z-50 opacity-[0.06] mix-blend-overlay"
		style="background-image: url('https://grainy-gradients.vercel.app/noise.svg');"
	></div>

	<!-- NAVIGATION -->
	<nav
		class="fixed top-0 z-40 flex w-full items-start justify-between px-6 py-6 transition-all duration-500 {scrollY >
		50
			? 'bg-black/40 backdrop-blur-md'
			: ''}"
	>
		<div class="flex flex-col mix-blend-difference">
			<div
				class="inline-block -rotate-1 transform bg-white px-2 py-1 text-sm leading-none font-bold tracking-tight text-black uppercase"
			>
				Washed Up
			</div>
			<div class="mt-2 pl-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
				Charleston, SC
			</div>
		</div>
		<div class="text-right mix-blend-difference">
			<div class="border border-white/20 bg-black/80 px-2 py-0.5 text-xs font-bold text-white">
				EST. 2024
			</div>
			<div class="mt-1 animate-pulse font-mono text-[10px] text-(--frosted-blue)">● LIVE</div>
		</div>
	</nav>

	<!-- SECTION 1: HERO (Spring Physics Parallax) -->
	<section class="relative flex h-screen flex-col items-center justify-center overflow-hidden px-4">
		<!-- BACKGROUND BLOBS (Reactive to spring) -->
		<div
			class="absolute top-1/4 left-1/4 h-[50vh] w-[50vh] rounded-full opacity-60 mix-blend-screen blur-[120px] will-change-transform"
			style="background-color: var(--vintage-grape); transform: translateY({$smoothScroll *
				0.15}px);"
		></div>
		<div
			class="absolute right-0 bottom-0 h-[60vh] w-[60vh] rounded-full opacity-50 mix-blend-screen blur-[140px] will-change-transform"
			style="background-color: var(--frosted-blue); transform: translateY({$smoothScroll *
				-0.1}px);"
		></div>

		<!-- BACKGROUND TEXT WALL -->
		<div
			class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.25] mix-blend-overlay select-none"
		>
			<div class="flex w-[150%] -rotate-12 flex-col gap-0">
				{#each Array(10) as _, i}
					<div
						class="text-[10vw] leading-[0.85] font-black tracking-tighter whitespace-nowrap text-white uppercase will-change-transform"
						style="transform: translateX({(i % 2 === 0 ? -1 : 1) * $smoothScroll * 0.08}px);"
					>
						Run. Dip. Sip.
					</div>
				{/each}
			</div>
		</div>

		<!-- HERO TEXT -->
		<div
			class="relative z-10 flex flex-col items-center will-change-transform"
			style="transform: translateY({$smoothScroll * 0.3}px); opacity: {1 -
				scrollY / (innerHeight * 0.8)};"
		>
			<div class="relative">
				<!-- Blur/Ghost Layer -->
				<h1
					class="absolute inset-0 scale-105 transform text-center text-[15vw] leading-[0.8] font-bold tracking-[-0.06em] text-(--accent-lime) opacity-20 blur-xl"
				>
					Run.<br />Dip.<br />Sip.
				</h1>
				<!-- Crisp Layer -->
				<h1
					class="relative z-10 text-center text-[15vw] leading-[0.8] font-bold tracking-[-0.06em] uppercase"
				>
					<span class="block text-white">Run.</span>
					<span class="block text-white/80">Dip.</span>
					<span class="block bg-linear-to-b from-white to-white/10 bg-clip-text text-transparent"
						>Sip.</span
					>
				</h1>
			</div>

			<div class="mt-12 flex items-center gap-4">
				<div class="h-px w-12 bg-white/30"></div>
				<p class="text-xs font-bold tracking-[0.2em] text-white/60 uppercase">Scroll to Decay</p>
				<div class="h-px w-12 bg-white/30"></div>
			</div>
		</div>

		<!-- Fade out gradient -->
		<div
			class="absolute bottom-0 z-20 h-32 w-full bg-linear-to-b from-transparent to-[#050505]"
		></div>
	</section>

	<!-- SECTION 2: MANIFESTO -->
	<section class="relative z-20 mx-auto max-w-4xl px-6 py-32 md:py-40">
		<div use:reveal class="reveal">
			<span class="mb-6 block text-xs font-bold tracking-widest text-(--accent-lime) uppercase"
				>( The Process )</span
			>
			<h2 class="mb-12 text-4xl leading-[1.1] font-medium tracking-tight text-white md:text-6xl">
				We aren't training for the Olympics. We're training so we can eat <span
					class="text-(--frosted-blue) italic">pastries</span
				> without guilt.
			</h2>

			<div class="grid gap-12 border-t border-white/10 pt-12 md:grid-cols-2">
				<p class="text-lg leading-relaxed font-light text-gray-400">
					Washed Up Coffee Club is a collective of former "fast" people (and people who were never
					fast) meeting up to put miles on legs and caffeine in veins. No drop policy, unless you
					drop your croissant.
				</p>
				<div class="border-l-2 border-(--vintage-grape) pl-6">
					<p class="text-xl leading-tight font-bold text-white">
						"It’s not about the pace. It’s about the company."
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- SECTION 3: CAMERA ROLL (Sticky Horizontal Scroll) -->
	<!-- Reduced to 250vh to make it snappier -->
	<div bind:this={cameraRollSection} class="relative h-[250vh] w-full bg-[#050505]">
		<div class="sticky top-0 flex h-screen w-full items-center overflow-hidden">
			<!-- GRADIENT MASKS (Softens the edges) -->
			<div
				class="pointer-events-none absolute inset-y-0 left-0 z-30 w-16 bg-linear-to-r from-[#050505] to-transparent md:w-40"
			></div>
			<div
				class="pointer-events-none absolute inset-y-0 right-0 z-30 w-16 bg-linear-to-l from-[#050505] to-transparent md:w-40"
			></div>

			<!-- Sticky Header Title -->
			<div
				class="pointer-events-none absolute top-10 left-6 z-20 mix-blend-difference md:top-20 md:left-20"
			>
				<h3 class="mb-2 text-sm font-bold tracking-widest text-white uppercase">( Evidence )</h3>
				<h2 class="text-5xl font-bold tracking-tighter text-white md:text-7xl">Camera Roll</h2>
			</div>

			<!-- The Moving Film Strip -->
			<!-- Adjusted padding: pl-[50vw] -> pl-[30vw] to start visible content sooner -->
			<!-- Adjusted transform: -75% ensures the last item stays on screen longer -->
			<div
				class="flex gap-8 pl-[60vw] will-change-transform md:gap-16 md:pl-[40vw]"
				style="transform: translateX(-{cameraRollProgress * 75}%);"
			>
				{#each memories as memory, i}
					<div
						class="group relative flex shrink-0 flex-col gap-4"
						style="
							transform: scale({1 - Math.abs(cameraRollProgress * 5 - i) * 0.1}); 
							opacity: {1 - Math.abs(cameraRollProgress * 5 - i) * 0.6};
							transition: transform 0.1s, opacity 0.1s;
						"
					>
						<div
							class="relative h-[50vh] w-[35vh] overflow-hidden rounded-sm bg-gray-900 shadow-2xl md:h-[60vh] md:w-[45vh]"
						>
							<img
								src={memory.src}
								alt="Memory"
								class="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
							/>
							<div
								class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-30"
							></div>
						</div>
						<p
							class="font-mono text-xs font-bold tracking-widest text-gray-500 uppercase transition-colors group-hover:text-(--accent-lime)"
						>
							{memory.caption}
						</p>
					</div>
				{/each}
				<!-- Spacer -->
				<div class="w-[10vw] shrink-0"></div>
			</div>
		</div>
	</div>

	<!-- SECTION 4: THE ROUTINE -->
	<section class="relative z-10 overflow-hidden bg-[#050505] px-6 py-32 md:py-48">
		<!-- TOP GRADIENT TRANSITION (Added this to smooth the entry) -->
		<div
			class="pointer-events-none absolute top-0 left-0 z-20 h-40 w-full bg-linear-to-b from-[#050505] via-[#050505]/80 to-transparent"
		></div>

		<!-- Background Glow -->
		<div
			class="pointer-events-none absolute top-0 left-1/2 h-[500px] w-full -translate-x-1/2 -translate-y-[20%] rounded-full opacity-20 blur-[140px]"
			style="background-color: var(--frosted-blue);"
		></div>

		<!-- BACKGROUND TEXT WALL (Re-added) -->
		<div
			class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.15] mix-blend-overlay select-none"
		>
			<div class="flex w-[150%] rotate-12 flex-col gap-0">
				{#each Array(10) as _, i}
					<div
						class="text-[10vw] leading-[0.85] font-black tracking-tighter whitespace-nowrap text-white uppercase will-change-transform"
						style="transform: translateX({(i % 2 === 0 ? 1 : -1) * ($smoothScroll * 0.05)}px);"
					>
						Saturday. Thursday.
					</div>
				{/each}
			</div>
		</div>

		<div class="relative z-10 mx-auto max-w-5xl">
			<h2
				class="mb-24 text-center text-4xl font-bold tracking-tighter text-white md:text-8xl"
				use:reveal
			>
				The Routine.
			</h2>

			<div class="flex flex-col gap-px border border-white/10 bg-white/10">
				{#each routineSchedule as schedule}
					<div
						class="group relative overflow-hidden bg-[#0a0a0a] p-8 transition-colors hover:bg-[#111] md:p-12"
					>
						<!-- Hover Accent Line -->
						<div
							class="absolute top-0 left-0 h-full w-1 scale-y-0 bg-[var(--accent)] transition-transform duration-300 group-hover:scale-y-100"
							style="--accent: {schedule.accentColor}"
						></div>

						<div
							class="relative z-10 flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between"
						>
							<h3
								class="text-4xl font-bold tracking-tight text-white transition-colors group-hover:text-[var(--accent)] md:text-6xl"
								style="--accent: {schedule.accentColor}"
							>
								{schedule.day}
							</h3>
							<div class="text-right">
								<span class="block text-2xl font-medium text-white">{schedule.time}</span>
								<span
									class="mt-1 block text-sm font-bold tracking-widest text-gray-500 uppercase opacity-60"
								>
									{schedule.location}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- SECTION 5: FOOTER -->
	<section class="relative flex h-[80vh] flex-col items-center justify-center overflow-hidden">
		<!-- Huge Glow -->
		<div
			class="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-[150px]"
			style="background-color: var(--accent-lime);"
		></div>

		<div class="relative z-10 text-center" use:reveal>
			<h2 class="mb-10 text-6xl leading-[0.85] font-black tracking-tighter text-white md:text-9xl">
				SUFFER<br />TOGETHER
			</h2>

			<div class="group relative inline-block cursor-pointer">
				<div
					class="absolute -inset-1 rounded-full bg-linear-to-r from-(--accent-lime) to-(--frosted-blue) opacity-60 blur-lg transition duration-500 group-hover:opacity-100 group-hover:blur-xl"
				></div>
				<button
					class="relative rounded-full bg-white px-10 py-4 text-lg font-bold tracking-tight text-black transition-transform duration-200 active:scale-95"
				>
					Connect Strava
				</button>
			</div>
		</div>

		<footer
			class="absolute bottom-8 w-full text-center font-mono text-[10px] tracking-widest text-white/30 uppercase"
		>
			Charleston, SC // Est 2024
		</footer>
	</section>
</div>
