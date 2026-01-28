<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ChallengeParticipantWithRelations } from '$lib/types/dashboard.js';
	import { getDashboardContext } from '../_logic/context.js';

	let dashboard = getDashboardContext();
	let challenge = $derived(dashboard.selectedChallenge);

	type JoinChallengeResultData = {
		success: boolean;
		challengeParticipantWithRelations: ChallengeParticipantWithRelations;
	};
</script>

{#if challenge}
	<div class="flex">
		{#if challenge.isParticipating}
			<div
				class="group relative flex rounded-full border border-(--accent-lime)/30 bg-(--accent-lime)/10 px-4 py-2 text-sm font-bold tracking-widest text-(--accent-lime) uppercase backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,0,0.2)]"
			>
				You're In!
			</div>
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
					class="group relative overflow-hidden rounded-full border-2 border-(--accent-lime)/30 bg-(--accent-lime)/10 px-4 py-2 text-sm font-bold tracking-widest text-(--accent-lime) uppercase backdrop-blur-sm transition-all hover:bg-(--accent-lime)/20 hover:shadow-[0_0_30px_-10px_var(--accent-lime)] disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span class="relative z-10">Leave Challenge</span>
					<div
						class="absolute inset-0 bg-(--accent-lime)/20 opacity-0 transition-opacity group-hover:opacity-100"
					></div>
				</button>
			</form>
		{:else if challenge.joinable}
			<form
				method="POST"
				action="?/joinChallenge"
				use:enhance={() => {
					challenge.isSubmitting = true;
					return async ({ result, update }) => {
						if (result.type === 'success') {
							// Optimistic update: immediate UI feedback
							const { challengeParticipantWithRelations } = result.data as JoinChallengeResultData;
							challenge.join(challengeParticipantWithRelations);
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
					class="group relative overflow-hidden rounded-full border-2 border-(--accent-lime) bg-(--accent-lime)/10 px-6 py-3 text-sm font-bold tracking-widest text-(--accent-lime) uppercase backdrop-blur-sm transition-all hover:bg-(--accent-lime)/20 hover:shadow-[0_0_30px_-10px_var(--accent-lime)] disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span class="relative z-10">{challenge.isSubmitting ? 'Joining...' : 'Join Challenge'}</span>
					<!-- Hover Glow Effect -->
					<div
						class="absolute inset-0 bg-(--accent-lime)/20 opacity-0 transition-opacity group-hover:opacity-100"
					></div>
				</button>
			</form>
		{:else}
			<div
				class="flex rounded-full border border-gray-600 bg-gray-800/50 px-4 py-2 text-sm font-bold tracking-widest text-gray-500 uppercase"
			>
				Challenge Ended
			</div>
		{/if}
	</div>
{/if}
