<script lang="ts">
	import { ArrowRight, LayoutDashboard } from 'lucide-svelte';
	import stravaConnectButton from '$lib/assets/strava_buttons/connect_with_strava_orange/btn_strava_connect_with_orange.svg';

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
	class="flex flex-col items-center justify-center bg-[#050505] px-4 py-20 text-center md:py-28"
>
	<div class="px-4 text-center" use:reveal>
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
					href="/dashboard"
					aria-label="Go to dashboard"
					class="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-bold tracking-widest text-white uppercase backdrop-blur-md transition-all hover:border-(--accent-lime) hover:text-(--accent-lime)"
				>
					<LayoutDashboard class="h-5 w-5 shrink-0 text-(--accent-lime)" aria-hidden="true" />
					<span class="">Head To The Dashboard</span>
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
</section>
