<script lang="ts">
	import { formatDate } from '$lib/utils/date-utils.js';
	import { getDashboardContext } from '../_logic/context.js';
	import CountdownTimer from './CountdownTimer.svelte';
	import ChallengeStatsGrid from './ChallengeStatsGrid.svelte';
	import JoinChallengeButton from './JoinChallengeButton.svelte';

	const dashboard = getDashboardContext();
	const challenge = $derived(dashboard.selectedChallenge);

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

{#if challenge}
	<header class="mx-auto mb-16 max-w-5xl px-6">
		<!-- Glassmorphic Container with Reveal Animation -->
		<div
			use:reveal
			class="reveal relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-8 backdrop-blur-md"
		>
			<!-- Gradient Overlay for Depth -->
			<div
				class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/5 to-transparent"
			></div>

			<div class="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
				<div class="space-y-2">
					<div class="flex items-center gap-3">
						<!-- Enhanced Badge with Glow -->
						<span
							class="inline-block rounded-full border border-(--accent-lime)/30 bg-(--accent-lime)/10 px-3 py-1 text-[10px] font-bold tracking-widest text-(--accent-lime) uppercase shadow-[0_0_20px_rgba(0,255,0,0.3)]"
						>
							Active Challenge
						</span>
						<span class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">
							{formatDate(challenge.startDate || new Date())}
						</span>
					</div>
					<!-- Challenge Title with Gradient Text Effect -->
					<h1
						class="text-4xl font-black tracking-tighter text-white uppercase italic md:text-6xl md:whitespace-nowrap"
					>
						<span
							class="bg-linear-to-r from-(--accent-lime) to-white bg-clip-text text-transparent"
						>
							{challenge.title}
						</span>
					</h1>
					<div class="mt-4">
						<JoinChallengeButton />
					</div>
				</div>

				<CountdownTimer />
			</div>
		</div>

		<ChallengeStatsGrid />
	</header>
{/if}
