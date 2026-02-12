<script lang="ts">
	import { CHALLENGE_STATUS } from '$lib/constants/challenge-constants.js';
	import type { ChallengeUI } from '../_logic/ChallengeUI.svelte.js';
	import type { Profile } from '$lib/db/schema.js';

	let {
		challenges,
		selectedChallengeId,
		profile,
		onSelect
	}: {
		challenges: ChallengeUI[];
		selectedChallengeId: string | null;
		profile: Profile;
		onSelect: (id: string) => void;
	} = $props();

	function getStatusColor(status: string): string {
		switch (status) {
			case CHALLENGE_STATUS.ACTIVE:
				return 'bg-(--accent-lime)';
			case CHALLENGE_STATUS.UPCOMING:
				return 'bg-yellow-500';
			case CHALLENGE_STATUS.COMPLETED:
				return 'bg-(--grey-olive)';
			default:
				return 'bg-(--grey-olive)';
		}
	}

	function formatDateRange(startDate: Date, endDate: Date): string {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const now = new Date();

		// If challenge is active and ending soon, show time left
		if (start <= now && end > now) {
			return 'Active';
		}

		// Format as month/day
		const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
		return `${formatter.format(start)} - ${formatter.format(end)}`;
	}
</script>

{#each challenges as challenge (challenge.id)}
	<button
		type="button"
		onclick={() => onSelect(challenge.id)}
		class="group relative flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/5
			{challenge.id === selectedChallengeId ? 'bg-white/10' : ''}"
	>
		<!-- Left border for selected state -->
		{#if challenge.id === selectedChallengeId}
			<div class="absolute top-0 bottom-0 left-0 w-0.5 bg-(--accent-lime)"></div>
		{/if}

		<!-- Status dot -->
		<div class="mt-1.5 shrink-0">
			<div class="h-2 w-2 rounded-full {getStatusColor(challenge.status)}"></div>
		</div>

		<!-- Content -->
		<div class="min-w-0 flex-1">
			<!-- Title -->
			<div class="truncate text-sm font-medium text-white">
				{challenge.title}
			</div>

			<!-- Meta info -->
			<div class="mt-0.5 flex items-center gap-2 text-xs text-(--grey-olive)">
				<span>{formatDateRange(challenge.startDate, challenge.endDate)}</span>
				{#if challenge.status === CHALLENGE_STATUS.ACTIVE && challenge.timeLeft}
					<span class="text-(--accent-lime)">• {challenge.timeLeft}</span>
				{/if}
			</div>
		</div>

		<!-- Rank badge -->
		{#if challenge.isParticipating}
			{@const rank = challenge.getCurrentUserRank(profile.id)}
			{#if rank}
				<div class="shrink-0">
					<div
						class="flex h-6 min-w-6 items-center justify-center rounded bg-(--accent-lime)/10 px-1.5 font-mono text-xs font-semibold text-(--accent-lime)"
					>
						#{rank}
					</div>
				</div>
			{:else}
				<div class="shrink-0 text-xs text-(--grey-olive)">Joined</div>
			{/if}
		{/if}
	</button>
{/each}
