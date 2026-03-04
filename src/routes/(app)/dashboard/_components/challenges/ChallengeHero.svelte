<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { getFormActionError } from '$lib/utils/form-action.js';
	import { formatDate } from '$lib/utils/datetime.js';
	import { getDashboardContext } from '../../_logic/context.js';
	import CountdownTimer from './CountdownTimer.svelte';
	import ChallengeStatsGrid from './ChallengeStatsGrid.svelte';
	import JoinChallengeButton from './JoinChallengeButton.svelte';

	const dashboard = getDashboardContext();
	let challenge = $derived(dashboard.selectedChallenge);
</script>

{#if challenge}
	<header class="mb-16 w-full px-6">
		<!-- Glassmorphic Container -->
		<div
			class="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-md"
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
						<!-- Challenge status badge -->
						<span
							class="inline-block rounded-full border px-3 py-1 text-[10px] tracking-widest uppercase {challenge.badgeClasses}"
						>
							{challenge.badgeLabel}
						</span>
						<span class="text-[10px] tracking-widest text-gray-500 uppercase">
							{formatDate(challenge.startDate || new Date())}
						</span>
					</div>

					{#if challenge.isParticipating}
						<!-- Leave button: secondary/destructive action -->
						<!-- challenge is a ChallengeUI instance from context; mutating its properties is intentional for optimistic UI -->
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
										challenge.isSubmitting = false;
										const errorMsg =
											getFormActionError(result) ?? 'Something went wrong. Please try again.';
										toast.error(errorMsg);
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
