<script lang="ts">
	import { formatDate } from '$lib/utils/date-utils.js';
	import type { ChallengeStats, ChallengeWithParticipation } from '$lib/types/dashboard.js';
	import CountdownTimer from './CountdownTimer.svelte';
	import ChallengeStatsGrid from './ChallengeStatsGrid.svelte';
	import JoinChallengeButton from './JoinChallengeButton.svelte';

	type Props = {
		challenge: ChallengeWithParticipation;
		timeLeft: string;
		stats: ChallengeStats;
		isSubmitting?: boolean;
	};

	let { challenge, timeLeft, stats, isSubmitting = false }: Props = $props();
</script>

<header class="mx-auto mb-16 max-w-5xl px-6">
	<div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
		<div class="space-y-2">
			<div class="flex items-center gap-3">
				<span
					class="rounded-full border border-(--accent-lime)/30 bg-(--accent-lime)/10 px-3 py-1 text-[10px] font-bold tracking-widest text-(--accent-lime) uppercase"
				>
					Active Challenge
				</span>
				<span class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">
					{formatDate(challenge.startDate)}
				</span>
			</div>
			<h1
				class="text-4xl font-black tracking-tighter text-white uppercase italic md:text-6xl md:whitespace-nowrap"
			>
				{challenge.title}
			</h1>
			<div class="mt-4">
				<JoinChallengeButton {challenge} {isSubmitting} />
			</div>
		</div>

		<CountdownTimer {timeLeft} />
	</div>

	<ChallengeStatsGrid {stats} />
</header>
