<script lang="ts">
	import { onMount } from 'svelte';

	// Svelte 5 Runes
	let scrollY = $state(0);
	let innerHeight = $state(0);

	// Mock data for the "Camera Roll"
	const memories = [
		{
			id: 1,
			src: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=600&auto=format&fit=crop',
			caption: '06:00 AM // THE PAIN CAVE'
		},
		{
			id: 2,
			src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop',
			caption: 'COFFEE // POST-MORTEM'
		},
		{
			id: 3,
			src: 'https://images.unsplash.com/photo-1533561052669-c61d563d7676?q=80&w=600&auto=format&fit=crop',
			caption: 'SUNDAY // CHURCH'
		},
		{
			id: 4,
			src: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=600&auto=format&fit=crop',
			caption: 'NO ONE SURVIVED'
		}
	];

	function handleScroll() {
		scrollY = window.scrollY;
	}

	// Apple-style Scroll Reveal Action
	// UPDATED: Now reverses animation when scrolling up/away
	function reveal(node: HTMLElement) {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						node.classList.add('reveal-active');
					} else {
						// Remove class when out of view to allow re-animation
						node.classList.remove('reveal-active');
					}
				});
			},
			{ threshold: 0.15 } // Trigger when 15% visible
		);

		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<svelte:window bind:scrollY bind:innerHeight on:scroll={handleScroll} />

<!-- MAIN CONTAINER -->
<div
	class="relative w-full bg-[#050505] text-white selection:bg-[#ccff00] selection:text-black"
	style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;"
>
	<!-- STRONGER GRAIN OVERLAY -->
	<div
		class="pointer-events-none fixed inset-0 z-[60] opacity-[0.12] mix-blend-overlay"
		style="background-image: url('https://grainy-gradients.vercel.app/noise.svg');"
	></div>

	<!-- NAVIGATION -->
	<nav
		class="fixed top-0 z-50 flex w-full items-start justify-between px-6 py-8 mix-blend-difference"
	>
		<div class="flex flex-col">
			<div
				class="inline-block -rotate-1 transform bg-white px-1 py-0.5 text-sm leading-none font-bold tracking-tight text-black uppercase"
			>
				Washed Up Coffee Club
			</div>
			<div class="mt-2 pl-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
				Pittsburgh, PA
			</div>
		</div>
		<div class="text-right">
			<div
				class="border border-white/20 bg-black px-2 py-0.5 text-xs font-bold text-white opacity-100"
			>
				EST. 2024
			</div>
			<div class="mt-1 font-mono text-[10px] text-[#ccff00]">● LIVE</div>
		</div>
	</nav>

	<!-- HERO SECTION -->
	<section class="relative flex h-screen flex-col items-center justify-center overflow-hidden px-4">
		<!-- BRIGHTER Background Blobs -->
		<div
			class="animate-pulse-slow absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-purple-600/30 mix-blend-screen blur-[120px]"
		></div>
		<div
			class="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-blue-500/20 mix-blend-screen blur-[140px]"
		></div>
		<div
			class="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ccff00]/10 blur-[100px]"
		></div>

		<!-- REPEATED TEXT WALL (Background) -->
		<div
			class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.50] mix-blend-overlay select-none"
			style="mask-image: linear-gradient(135deg, black 0%, rgba(0,0,0,0.05) 90%); -webkit-mask-image: linear-gradient(135deg, black 0%, rgba(0,0,0,0.05) 90%);"
		>
			<div class="flex w-[200%] -rotate-12 flex-col gap-0">
				{#each Array(15) as _, i}
					<div
						class="text-[12vw] leading-[0.85] font-black tracking-tighter whitespace-nowrap text-white uppercase will-change-transform"
						style="transform: translateX(calc({i % 2 === 0 ? '-10%' : '5%'} + {(i % 2 === 0
							? -1
							: 1) *
							scrollY *
							0.2}px))"
					>
						Run. Dip. Sip. &nbsp; Run. Dip. Sip.
					</div>
				{/each}
			</div>
		</div>

		<!-- MAIN TYPOGRAPHY LAYER -->
		<!-- Parallax Scale/Fade Effect -->
		<div
			class="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center will-change-transform"
			style="transform: scale({1 - scrollY * 0.0005}) translateY({scrollY * 0.2}px); opacity: {1 -
				scrollY * 0.002}"
		>
			<!-- Date Stamp (Top Left) -->
			<div class="absolute -top-32 left-0 hidden rotate-[-4deg] md:block">
				<span
					class="bg-white box-decoration-clone px-2 py-1 text-xs font-bold tracking-widest text-black uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
				>
					(Actual Life 3)<br />
					January 1 — December 31
				</span>
			</div>

			<!-- FRED AGAIN STYLE TEXT -->
			<div class="relative">
				<!-- The "Ghost" Layer -->
				<h1
					class="pointer-events-none absolute inset-0 scale-105 transform text-center text-[13vw] leading-[0.8] font-bold tracking-[-0.06em] text-white/40 uppercase blur-[12px] select-none"
				>
					<span class="block">Run.</span>
					<span class="block">Dip.</span>
					<span class="block">Sip.</span>
				</h1>

				<!-- The "Real" Layer -->
				<h1
					class="relative z-10 text-center text-[13vw] leading-[0.8] font-bold tracking-[-0.06em] uppercase mix-blend-screen select-none"
				>
					<span class="block text-white">Run.</span>
					<span class="block text-white/90">Dip.</span>
					<span class="block bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent"
						>Sip.</span
					>
				</h1>
			</div>

			<!-- The "Subtitle" -->
			<div class="z-20 mt-16 text-center">
				<p
					class="inline-block rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium tracking-wide backdrop-blur-md md:text-sm"
				>
					feat. <span class="text-[#ccff00]">The Panic of the Last Mile</span>
				</p>
			</div>
		</div>

		<!-- Scroll Indicator -->
		<div
			class="absolute bottom-12 left-0 w-full text-center mix-blend-difference"
			style="opacity: {1 - scrollY * 0.005}"
		>
			<span class="text-[10px] font-bold tracking-[0.3em] text-white/60 uppercase"
				>Scroll to Decay</span
			>
		</div>

		<!-- TRANSITION GRADIENT: Hero -> Manifesto -->
		<div
			class="pointer-events-none absolute bottom-0 left-0 z-20 h-64 w-full bg-gradient-to-b from-transparent to-[#050505]"
		></div>
	</section>

	<!-- "THE MANIFESTO" -->
	<section class="relative z-20 bg-[#050505] px-6 py-40">
		<!-- LIGHT SPILL: Hero -> Manifesto (Purple) -->
		<div
			class="pointer-events-none absolute top-0 left-1/2 h-96 w-full -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-purple-900/20 blur-[120px]"
		></div>

		<div use:reveal class="reveal relative mx-auto max-w-3xl">
			<!-- Sticker Graphic -->
			<div
				class="absolute -top-16 right-0 z-10 -rotate-6 bg-[#ccff00] px-6 py-3 text-xl font-black tracking-tighter text-black shadow-[0_0_50px_rgba(204,255,0,0.2)] md:-right-24"
			>
				SLOW IS OKAY
			</div>

			<h2 class="mb-12 text-5xl font-bold tracking-[-0.04em] text-white md:text-7xl">
				The Process<span class="text-purple-500">.</span>
			</h2>

			<div class="space-y-8 text-xl leading-snug font-medium text-gray-300 md:text-2xl">
				<p>
					We aren't training for the Olympics. We're training so we can eat pastries without guilt.
				</p>
				<p class="text-white">
					Washed Up Coffee Club is a collective of former "fast" people (and people who were never
					fast) meeting up to put miles on legs and caffeine in veins.
				</p>

				<!-- Pull Quote Style -->
				<div class="border-l-4 border-white/10 pt-8 pl-6">
					<p
						class="cursor-default text-3xl font-bold tracking-tight text-white/40 transition-colors duration-500 hover:text-white md:text-4xl"
					>
						"It’s not about the pace.<br />
						It’s about the
						<span class="bg-white/10 box-decoration-clone px-2 text-[#ccff00]">company</span>."
					</p>
				</div>
			</div>
		</div>

		<!-- TRANSITION GRADIENT: Manifesto -> Camera Roll (#050505 to #080808) -->
		<div
			class="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-gradient-to-b from-transparent to-[#080808]"
		></div>
	</section>

	<!-- "CAMERA ROLL" -->
	<section use:reveal class="reveal relative z-20 bg-[#080808] py-20">
		<!-- LIGHT SPILL: Manifesto -> Camera Roll (Acid Green) -->
		<div
			class="pointer-events-none absolute top-0 left-1/2 h-64 w-full -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-[#ccff00]/5 blur-[100px]"
		></div>

		<div class="mb-8 flex items-end justify-between px-6">
			<h3 class="text-xs font-bold tracking-widest text-white/50 uppercase">(Evidence)</h3>
			<span class="rounded bg-white/5 px-2 py-1 text-xs font-bold text-[#ccff00]">.HEIC // RAW</span
			>
		</div>

		<!-- Grid -->
		<div class="grid grid-cols-2 gap-2 px-2 md:grid-cols-4">
			{#each memories as memory}
				<div class="group relative aspect-[3/4] overflow-hidden bg-gray-900">
					<!-- Image -->
					<img
						src={memory.src}
						alt="Run Memory"
						class="group-hover:blur-0 h-full w-full scale-110 object-cover opacity-50 blur-xl grayscale transition-all duration-700
                   ease-out group-hover:scale-100 group-hover:opacity-100 group-hover:grayscale-0"
					/>

					<!-- Text overlay -->
					<div
						class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
					>
						<p
							class="-rotate-2 bg-black px-3 py-1 text-center text-xs font-bold text-white shadow-xl md:text-sm"
						>
							{memory.caption}
						</p>
					</div>
				</div>
			{/each}
		</div>

		<!-- TRANSITION GRADIENT: Camera Roll -> Routine (#080808 to #050505) -->
		<div
			class="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-gradient-to-b from-transparent to-[#050505]"
		></div>
	</section>

	<!-- ROUTINE / LOGISTICS -->
	<section use:reveal class="reveal relative z-10 overflow-hidden px-6 py-40">
		<!-- LIGHT SPILL: Camera Roll -> Routine (Blue) -->
		<div
			class="pointer-events-none absolute top-0 left-1/2 h-96 w-full -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-blue-900/20 blur-[120px]"
		></div>

		<!-- VISIBLE WATERMARK -->
		<div
			class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[25vw] font-bold tracking-tighter whitespace-nowrap text-white/[0.08] blur-[4px] select-none"
		>
			ROUTINE
		</div>

		<div class="relative z-10 mx-auto grid max-w-4xl gap-24">
			<!-- Saturday -->
			<div class="group cursor-default">
				<h3
					class="text-6xl font-bold tracking-tighter text-white transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#ccff00] group-hover:bg-clip-text group-hover:text-transparent md:text-8xl"
				>
					Saturday.
				</h3>
				<div
					class="mt-6 flex flex-col gap-6 border-l-2 border-white/20 pl-6 transition-colors group-hover:border-[#ccff00] md:flex-row md:items-center md:gap-12"
				>
					<div>
						<span
							class="mb-1 block inline-block bg-white/5 px-1 text-xs font-bold tracking-widest text-gray-500 uppercase"
							>Time</span
						>
						<span class="block text-2xl font-medium">07:00 AM</span>
					</div>
					<div>
						<span
							class="mb-1 block inline-block bg-white/5 px-1 text-xs font-bold tracking-widest text-gray-500 uppercase"
							>Location</span
						>
						<span class="block text-2xl font-medium">The Fountain</span>
					</div>
				</div>
			</div>

			<!-- Thursday -->
			<div class="group cursor-default">
				<h3
					class="text-6xl font-bold tracking-tighter text-white transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent md:text-8xl"
				>
					Thursday.
				</h3>
				<div
					class="mt-6 flex flex-col gap-6 border-l-2 border-white/20 pl-6 transition-colors group-hover:border-purple-500 md:flex-row md:items-center md:gap-12"
				>
					<div>
						<span
							class="mb-1 block inline-block bg-white/5 px-1 text-xs font-bold tracking-widest text-gray-500 uppercase"
							>Time</span
						>
						<span class="block text-2xl font-medium">06:30 PM</span>
					</div>
					<div>
						<span
							class="mb-1 block inline-block bg-white/5 px-1 text-xs font-bold tracking-widest text-gray-500 uppercase"
							>Location</span
						>
						<span class="block text-2xl font-medium">Rotating Taprooms</span>
					</div>
				</div>
			</div>
		</div>

		<!-- TRANSITION GRADIENT: Routine -> Footer (Subtle depth) -->
		<div
			class="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-gradient-to-b from-transparent to-[#050505]"
		></div>
	</section>

	<!-- FOOTER / CTA -->
	<section
		use:reveal
		class="reveal relative z-20 flex h-[80vh] flex-col items-center justify-center px-4"
	>
		<!-- LIGHT SPILL: Routine -> Footer (Purple again to close loop) -->
		<div
			class="pointer-events-none absolute top-0 left-1/2 h-64 w-full -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-purple-900/10 blur-[100px]"
		></div>

		<div class="mb-16 text-center">
			<p
				class="mb-4 inline-block bg-white/5 px-2 py-1 text-sm font-bold tracking-widest text-gray-500 uppercase"
			>
				(Join The Club)
			</p>
			<h2 class="text-5xl font-bold tracking-[-0.04em] text-white md:text-7xl">
				Ready to <br />
				<span
					class="hover:blur-0 cursor-pointer bg-gradient-to-r from-[#ccff00] to-green-500 bg-clip-text text-transparent blur-[2px] transition-all duration-500"
					>Suffer Together?</span
				>
			</h2>
		</div>

		<!-- AUTH BUTTON -->
		<div class="group relative cursor-pointer">
			<!-- Glow effect -->
			<div
				class="absolute -inset-2 rounded-lg bg-[#FC4C02] opacity-20 blur-xl transition duration-500 group-hover:opacity-50"
			></div>

			<button
				class="relative flex items-center gap-4 rounded-lg border border-white/20 bg-black px-10 py-5 text-white transition-all duration-300 hover:border-[#FC4C02] hover:bg-[#FC4C02]/10"
			>
				<span class="text-xl font-black text-[#FC4C02]">STRAVA</span>
				<div class="h-6 w-px bg-white/20"></div>
				<span class="font-bold tracking-wide">Connect Account</span>
			</button>

			<p
				class="absolute top-full left-0 mt-6 w-full text-center text-[10px] font-bold tracking-widest text-gray-500 uppercase opacity-0 transition-opacity group-hover:opacity-100"
			>
				Required for Leaderboard
			</p>
		</div>

		<footer class="absolute bottom-8 w-full text-center">
			<p class="text-[10px] tracking-widest text-white/30 uppercase">
				Washed Up Coffee Club &copy; {new Date().getFullYear()}
			</p>
		</footer>
	</section>
</div>

<style>
	/* Slow pulse for the background blobs */
	@keyframes pulse-slow {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(1);
		}
		50% {
			opacity: 0.2;
			transform: scale(1.1);
		}
	}
	.animate-pulse-slow {
		animation: pulse-slow 10s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	/* Apple-style Reveal Animation Classes */
	:global(.reveal) {
		opacity: 0;
		transform: translateY(40px) scale(0.98);
		transition:
			opacity 1.2s cubic-bezier(0.2, 0.8, 0.2, 1),
			transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
		will-change: opacity, transform;
	}

	:global(.reveal-active) {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	/* Global Scroll Fix: Handles body background and overflow */
	:global(body) {
		background-color: #050505;
		overflow-x: hidden;
	}
</style>
