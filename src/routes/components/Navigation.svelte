<script lang="ts">
	import { fade } from 'svelte/transition';
	import whiteStravaConnectButton from '$lib/assets/1.1 Connect with Strava Buttons/Connect with Strava White/btn_strava_connect_with_white.svg';

	let { scrollY, isLoggedIn } = $props();
</script>

<nav
	class="fixed top-0 z-40 flex w-full items-start justify-between px-6 py-6 transition-all duration-500 {scrollY >
	50
		? 'bg-black/80 shadow-sm backdrop-blur-md'
		: ''}"
>
	<div class="flex flex-col mix-blend-difference">
		<div class="flex items-center gap-2">
			<div class="h-3 w-3 rounded-full bg-(--accent-lime)"></div>
			<div class="text-sm font-bold tracking-tight text-white uppercase">Washed Up CC</div>
		</div>
		<div class="hidden pl-5 font-mono text-[10px] tracking-widest text-gray-400 uppercase sm:block">
			CHS / SC / USA
		</div>
	</div>

	<div class="flex items-center gap-6">
		{#if isLoggedIn}
			<button
				class="hidden rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-bold tracking-widest text-white uppercase backdrop-blur-md transition-all hover:border-(--accent-lime) hover:text-(--accent-lime) md:block"
			>
				Leaderboard
			</button>
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
			<div class="flex items-center justify-end gap-2 font-mono text-[10px] text-(--frosted-blue)">
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
