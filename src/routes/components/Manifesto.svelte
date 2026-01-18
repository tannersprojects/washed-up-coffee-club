<script lang="ts">
	import doHardThings from '$lib/assets/images/doHardThings.jpg';
	import community from '$lib/assets/images/theCommunity3.jpg';

	// Basic Reveal Action
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
</script>

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

		<div class="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
			<div
				class="group relative aspect-4/3 overflow-hidden rounded-sm border border-white/10 bg-white/5"
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
				class="group relative aspect-4/3 overflow-hidden rounded-sm border border-white/10 bg-white/5"
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
	<div
		class="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-linear-to-t from-[#050505] to-transparent"
	></div>
</section>
