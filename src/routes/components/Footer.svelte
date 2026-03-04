<script lang="ts">
	import stravaConnectButton from '$lib/assets/strava_buttons/connect_with_strava_orange/btn_strava_connect_with_orange.svg';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import { APP_FOOTER_VARIANT } from '$lib/constants';

	let { isLoggedIn } = $props();

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

<section
	class="relative flex h-[80vh] flex-col items-center justify-center overflow-hidden bg-[#050505] md:h-screen"
>
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
				class="mb-8 text-6xl leading-[0.85] font-black tracking-tighter text-white uppercase italic md:text-9xl"
			>
				Check Your<br /><span
					class="bg-linear-to-r from-(--accent-lime) to-white bg-clip-text text-transparent"
					>Splits</span
				>
			</h2>
		{:else}
			<h2
				class="mb-8 text-6xl leading-[0.85] font-black tracking-tighter text-white uppercase italic md:text-9xl"
			>
				Toe The<br /><span
					class="bg-linear-to-r from-(--vintage-grape) to-white bg-clip-text text-transparent"
					>Line</span
				>
			</h2>
		{/if}

		<div class="mt-8 flex justify-center">
			{#if isLoggedIn}
				<a
					class="group relative flex items-center gap-3 bg-white px-6 py-3 text-base font-bold tracking-wider text-black uppercase transition-all hover:bg-(--accent-lime) md:px-8 md:py-4 md:text-lg"
					href="/dashboard"
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
				</a>
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

	<AppFooter variant={APP_FOOTER_VARIANT.STANDARD} />
</section>
