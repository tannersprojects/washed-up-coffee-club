<script lang="ts">
	import { enhance } from '$app/forms';
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
			class="reveal relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md"
		>
			<!-- Gradient Overlay for Depth -->
			<div
				class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/5 to-transparent"
			></div>

			<!-- Content Container with Proper Padding -->
			<div class="relative z-10 p-6 md:p-8 lg:p-10">
				<!-- Top Row: Badges + Leave Button -->
				<div class="mb-6 flex flex-wrap items-center justify-between gap-4 md:mb-8">
					<div class="flex flex-wrap items-center gap-3">
						<!-- Active Challenge badge -->
						<span
							class="inline-block rounded-full border border-(--accent-lime)/40 bg-(--accent-lime)/5 px-3 py-1 text-[10px] tracking-widest text-(--accent-lime) uppercase"
						>
							Active Challenge
						</span>
						<span class="text-[10px] tracking-widest text-gray-500 uppercase">
							{formatDate(challenge.startDate || new Date())}
						</span>
					</div>

					{#if challenge.isParticipating}
						<!-- Leave button: secondary/destructive action -->
						<form
							method="POST"
							action="?/leaveChallenge"
							use:enhance={() => {
								challenge.isSubmitting = true;
								return async ({ result, update }) => {
									if (result.type === 'success') {
										// Optimistic update: immediate UI feedback
										challenge.leave();
										// Background sync: ensure server state is reflected
										await update();
									} else {
										// Reset submitting state on error
										challenge.isSubmitting = false;
									}
								};
							}}
						>
							<input type="hidden" name="challengeId" value={challenge.id} />
							<button
								type="submit"
								disabled={challenge.isSubmitting}
								class="cursor-pointer rounded-full border border-gray-600/80 bg-black/60 px-4 py-1.5 font-mono text-[10px] tracking-widest text-gray-300 uppercase transition-colors hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{challenge.isSubmitting ? 'Leaving...' : 'Leave Challenge'}
							</button>
						</form>
					{/if}
				</div>

				<!-- Middle Section: Title (Full Width) -->
				<div class="mb-8 flex md:mb-10">
					<!-- Challenge Title with Gradient Text Effect -->
					<h1
						class="text-4xl leading-[1.1] font-black tracking-tighter text-white uppercase italic md:text-5xl lg:text-6xl"
					>
						<span
							class="bg-linear-to-r from-(--accent-lime) to-white bg-clip-text pr-2 text-transparent"
						>
							{challenge.title}
						</span>
					</h1>
				</div>

				<!-- Bottom Row: Countdown + Action Button -->
				<div class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
					<!-- Countdown Timer -->
					<div class="shrink-0">
						<CountdownTimer />
					</div>

					<!-- Join/Status Button -->
					<div class="w-full md:w-auto">
						<JoinChallengeButton />
					</div>
				</div>
			</div>
		</div>

		<ChallengeStatsGrid />
	</header>
{/if}
