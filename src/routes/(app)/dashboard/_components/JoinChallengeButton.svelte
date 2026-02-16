<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ChallengeParticipantWithRelations } from '$lib/types/dashboard.js';
	import { formatDate } from '$lib/utils/datetime.js';
	import { CHALLENGE_JOIN_DISPLAY_STATE, CHALLENGE_STATUS } from '$lib/constants';
	import { getDashboardContext } from '../_logic/context.js';

	let dashboard = getDashboardContext();
	let challenge = $derived(dashboard.selectedChallenge);

	type JoinChallengeResultData = {
		success: boolean;
		challengeParticipantWithRelations: ChallengeParticipantWithRelations;
	};
</script>

{#if challenge}
	{#if challenge.joinDisplayState === CHALLENGE_JOIN_DISPLAY_STATE.JOINABLE}
		<div class="flex flex-col gap-2">
			<form
				method="POST"
				action="?/joinChallenge"
				use:enhance={() => {
					challenge.isSubmitting = true;
					return async ({ result, update }) => {
						if (result.type === 'success') {
							const { challengeParticipantWithRelations } = result.data as JoinChallengeResultData;
							challenge.join(challengeParticipantWithRelations);
							await update();
						} else {
							challenge.isSubmitting = false;
						}
					};
				}}
			>
				<input type="hidden" name="challengeId" value={challenge.id} />
				<button
					type="submit"
					disabled={challenge.isSubmitting}
					class="group relative overflow-hidden rounded-full border-2 border-(--accent-lime) bg-(--accent-lime) px-6 py-3 text-sm font-bold tracking-widest text-black uppercase backdrop-blur-sm transition-all hover:bg-(--accent-lime)/90 hover:shadow-[0_0_30px_-10px_var(--accent-lime)] disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span class="relative z-10">
						{challenge.isSubmitting ? 'Joining...' : 'Join Challenge'}
					</span>
					<div
						class="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100"
					></div>
				</button>
			</form>
			{#if challenge.challengeTimeState.status === CHALLENGE_STATUS.UPCOMING}
				<span class="text-center font-mono text-[10px] tracking-widest text-amber-400/80 uppercase">
					Starts {formatDate(challenge.startDate)}
				</span>
			{/if}
		</div>
	{:else if challenge.joinDisplayState === CHALLENGE_JOIN_DISPLAY_STATE.PARTICIPATING}
		<div
			class="inline-flex items-center rounded-full border border-(--accent-lime)/40 bg-(--accent-lime)/5 px-3 py-1 font-mono text-[10px] tracking-widest text-(--accent-lime) uppercase"
		>
			You're In
		</div>
	{:else if challenge.joinDisplayState === CHALLENGE_JOIN_DISPLAY_STATE.ENDED}
		<div
			class="inline-flex items-center rounded-full border border-gray-600 bg-gray-800/50 px-3 py-1 font-mono text-[10px] tracking-widest text-gray-400 uppercase"
		>
			Challenge Ended
		</div>
	{:else if challenge.joinDisplayState === CHALLENGE_JOIN_DISPLAY_STATE.NOT_ACTIVE}
		<div
			class="inline-flex items-center rounded-full border border-gray-600 bg-gray-800/50 px-3 py-1 font-mono text-[10px] tracking-widest text-gray-400 uppercase"
		>
			Not Active
		</div>
	{/if}
{/if}
