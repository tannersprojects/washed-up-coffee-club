<script lang="ts">
	import stravaLogo from '$lib/assets/strava_logos/powered_by_strava/pwrdBy_strava_white/api_logo_pwrdBy_strava_horiz_white.svg';
	import { APP_FOOTER_VARIANT, type AppFooterVariant } from '$lib/constants';

	let { variant = APP_FOOTER_VARIANT.STANDARD }: { variant?: AppFooterVariant } = $props();

	const isStrava = $derived(variant === APP_FOOTER_VARIANT.STRAVA);

	const wrapperClass = $derived(
		isStrava
			? 'absolute bottom-0 w-full border-t border-white/10 bg-[#050505]/80 px-6 py-2 backdrop-blur-md'
			: 'absolute bottom-8 w-full px-6 text-center font-mono text-[10px] tracking-widest text-white/30 uppercase'
	);

	const contentClass = $derived(
		isStrava
			? 'mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row'
			: 'flex flex-col items-center justify-center gap-2 md:flex-row md:gap-4'
	);
</script>

<footer class={wrapperClass}>
	<div class={contentClass}>
		<div
			class="flex flex-col gap-2 text-center font-mono text-[10px] tracking-widest text-white/30 uppercase md:flex-row md:items-center md:gap-4"
		>
			<span>EST. 2024</span>
			{#if !isStrava}
				<span class="hidden md:inline">///</span>
			{/if}
			<span>Charleston, SC</span>
		</div>
		{#if isStrava}
			<!-- Powered by Strava Logo - REQUIRED for compliance -->
			<div class="flex items-center gap-2">
				<a
					href="https://www.strava.com"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-block opacity-80 transition-opacity hover:opacity-100"
				>
					<img src={stravaLogo} alt="Powered by Strava" class="h-6 w-auto" />
				</a>
			</div>
		{/if}
	</div>
</footer>
