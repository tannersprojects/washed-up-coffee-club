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
				class="flex rounded-full border border-(--accent-lime)/30 bg-(--accent-lime)/10 px-4 py-2 text-sm font-bold tracking-widest text-(--accent-lime) uppercase"
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
					class="flex cursor-pointer rounded-full border border-(--accent-lime)/30 bg-(--accent-lime)/10 px-4 py-2 text-sm font-bold tracking-widest text-(--accent-lime) uppercase"
				>
					Leave Challenge
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
					class="flex rounded-full border border-(--accent-lime) bg-(--accent-lime) px-6 py-3 text-sm font-bold tracking-widest text-black uppercase transition-colors hover:bg-(--accent-lime)/90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{challenge.isSubmitting ? 'Joining...' : 'Join Challenge'}
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
