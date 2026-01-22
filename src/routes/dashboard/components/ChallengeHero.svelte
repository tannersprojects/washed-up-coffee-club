<script lang="ts">
	import { formatDate } from '$lib/utils/date-utils.js';
	import type { Challenge } from '$lib/db/schema';
	import type { ChallengeStats } from '../types.js';
	import CountdownTimer from './CountdownTimer.svelte';
	import ChallengeStatsGrid from './ChallengeStatsGrid.svelte';

	type Props = {
		challenge: Challenge;
		timeLeft: string;
		stats: ChallengeStats;
	};

	let { challenge, timeLeft, stats }: Props = $props();
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
				class="text-5xl font-black tracking-tighter text-white uppercase italic md:text-8xl"
			>
				{challenge.title}
			</h1>
		</div>

		<CountdownTimer {timeLeft} />
	</div>

	<ChallengeStatsGrid {stats} />
</header>
