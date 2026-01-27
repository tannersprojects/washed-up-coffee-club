<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ChallengeParticipant } from '$lib/db/schema.js';
	import { isChallengeJoinable } from '$lib/utils/challenge-utils.js';
	import { getDashboardContext } from '../_logic/context.js';

	let dashboard = getDashboardContext();
	let challenge = $derived(dashboard.selectedChallenge);
	let isSubmitting = $derived(dashboard.isSubmitting);
	let joinable = $derived(isChallengeJoinable(challenge));

	type JoinChallengeResultData = {
		success: boolean;
		challengeId: string;
		challengeParticipant: ChallengeParticipant;
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
					dashboard.isSubmitting = true;
					return async ({ result }) => {
						if (result.type === 'success') {
							dashboard.leaveChallenge(challenge.id);
						}
					};
				}}
			>
				<input type="hidden" name="challengeId" value={challenge?.id} />
				<button
					type="submit"
					disabled={isSubmitting}
					class="flex cursor-pointer rounded-full border border-(--accent-lime)/30 bg-(--accent-lime)/10 px-4 py-2 text-sm font-bold tracking-widest text-(--accent-lime) uppercase"
				>
					Leave Challenge
				</button>
			</form>
		{:else if joinable}
			<form
				method="POST"
				action="?/joinChallenge"
				use:enhance={() => {
					dashboard.isSubmitting = true;
					return async ({ result }) => {
						if (result.type === 'success') {
							const { challengeId, challengeParticipant } = result.data as JoinChallengeResultData;
							dashboard.joinChallenge(challengeId, challengeParticipant);
						}
					};
				}}
			>
				<input type="hidden" name="challengeId" value={challenge?.id} />
				<button
					type="submit"
					disabled={isSubmitting}
					class="flex rounded-full border border-(--accent-lime) bg-(--accent-lime) px-6 py-3 text-sm font-bold tracking-widest text-black uppercase transition-colors hover:bg-(--accent-lime)/90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isSubmitting ? 'Joining...' : 'Join Challenge'}
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
