<script lang="ts">
	import { getDashboardContext } from '../_logic/context.js';

	let dashboard = getDashboardContext();
	let challenge = $derived(dashboard.selectedChallenge);
	let leaderboard = $derived(challenge?.leaderboard);
	let stats = $derived(leaderboard?.stats);

	const statItems = $derived([
		{ id: 'totalRunners', label: 'Runners', value: stats?.totalRunners },
		{ id: 'finishers', label: 'Finished', value: stats?.finishers },
		{ id: 'activeRunners', label: 'On Course', value: stats?.activeRunners },
		{ id: 'totalDistanceKm', label: 'Total KM', value: stats?.totalDistanceKm }
	]);

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

{#if statItems}
	<div use:reveal class="reveal mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
		{#each statItems as statItem (statItem.id)}
			<div
				class="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-(--accent-lime)/50 hover:shadow-[0_0_30px_-10px_var(--accent-lime)]"
			>
				<!-- Gradient Overlay on Hover -->
				<div
					class="absolute inset-0 bg-linear-to-br from-(--accent-lime)/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
				></div>

				<div class="relative z-10 flex flex-col items-center justify-center">
					<span
						class="mb-2 block font-mono text-[10px] tracking-widest text-gray-500 uppercase transition-colors group-hover:text-white"
					>
						{statItem.label}
					</span>
					<span
						class="text-3xl font-black text-white transition-colors group-hover:text-(--accent-lime)"
					>
						{statItem.value}
					</span>
				</div>
			</div>
		{/each}
	</div>
{/if}
