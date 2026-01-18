<script lang="ts">
	let { schedule, index } = $props();

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

<div use:reveal class="reveal relative h-full w-full">
	<div
		class="card group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border p-6 transition-all duration-500 hover:-translate-y-2"
		style="--accent: {schedule.accentColor}"
	>
		<div class="mb-8 flex items-start justify-between">
			<h3
				class="day-name text-4xl font-black tracking-tighter text-white uppercase italic transition-colors"
			>
				{schedule.day}
			</h3>
			<span
				class="font-mono text-xs font-bold text-white/30 transition-colors group-hover:text-white"
			>
				0{index + 1}
			</span>
		</div>

		<div class="flex flex-col gap-1">
			<p class="text-lg font-bold text-gray-400 transition-colors group-hover:text-white">
				{schedule.description}
			</p>

			<div
				class="separator mt-4 flex items-center justify-between border-t border-white/10 pt-4 transition-colors"
			>
				<span class="font-mono text-xs tracking-widest text-gray-500 uppercase">
					{schedule.location}
				</span>
				<span class="time-text font-mono text-xl font-bold text-white transition-colors">
					{schedule.time}
				</span>
			</div>
		</div>
	</div>
</div>

<style>
	.card {
		/* Use a black background with slight transparency */
		background-color: rgba(0, 0, 0, 0.4);
		border-color: rgba(255, 255, 255, 0.1);

		/* Strong blur */
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);

		/* Force Hardware Acceleration (Fixes "missing blur" bugs in Safari/Chrome) */
		transform: translateZ(0);
		will-change: transform, background-color;
	}

	.card:hover {
		border-color: var(--accent);
		box-shadow: 0 0 30px -10px var(--accent);
		/* Darken slightly more on hover with accent tint */
		background-color: color-mix(in srgb, var(--accent) 15%, rgba(0, 0, 0, 0.5));
	}

	/* ... rest of your hover text styles ... */
	.card:hover .day-name {
		color: var(--accent);
		text-shadow: 0 0 20px color-mix(in srgb, var(--accent) 40%, transparent);
	}
	.card:hover .time-text {
		color: var(--accent);
	}
	.card:hover .separator {
		border-color: color-mix(in srgb, var(--accent) 50%, transparent);
	}
</style>
