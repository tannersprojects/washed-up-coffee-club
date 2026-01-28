<script lang="ts">
	import stravaLogo from '$lib/assets/1.2-Strava-API-Logos/Powered by Strava/pwrdBy_strava_white/api_logo_pwrdBy_strava_horiz_white.svg';

	// Reveal Animation Action
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

<footer
	use:reveal
	class="reveal relative border-t border-white/10 bg-[#050505]/80 px-6 py-8 backdrop-blur-md"
>
	<div class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
		<div class="flex flex-col gap-2 font-mono text-[10px] tracking-widest text-white/30 uppercase">
			<span>EST. 2024</span>
			<span>Charleston, SC</span>
		</div>

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
	</div>
</footer>
