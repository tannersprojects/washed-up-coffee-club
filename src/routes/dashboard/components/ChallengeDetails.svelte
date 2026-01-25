<script lang="ts">
	import { formatDate } from '$lib/utils/date-utils.js';
	import type { ChallengeWithParticipation } from '$lib/types/dashboard.js';

	type Props = {
		challenge: ChallengeWithParticipation;
	};

	let { challenge }: Props = $props();

	const goalDistanceKm = $derived(
		challenge.goalValue ? (challenge.goalValue / 1000).toFixed(1) : null
	);
</script>

<div class="space-y-8 py-8">
	<div class="space-y-4">
		<h2 class="text-2xl font-bold text-white uppercase">Challenge Details</h2>

		{#if challenge.description}
			<div>
				<h3 class="mb-2 font-mono text-xs tracking-widest text-gray-500 uppercase">Description</h3>
				<p class="text-white">{challenge.description}</p>
			</div>
		{/if}

		<div>
			<h3 class="mb-2 font-mono text-xs tracking-widest text-gray-500 uppercase">Challenge Type</h3>
			<p class="font-mono text-sm text-white uppercase">{challenge.type}</p>
		</div>

		{#if goalDistanceKm}
			<div>
				<h3 class="mb-2 font-mono text-xs tracking-widest text-gray-500 uppercase">
					Goal Distance
				</h3>
				<p class="font-mono text-2xl font-bold text-white">{goalDistanceKm} KM</p>
			</div>
		{/if}

		<div>
			<h3 class="mb-2 font-mono text-xs tracking-widest text-gray-500 uppercase">Start Date</h3>
			<p class="font-mono text-sm text-white">{formatDate(challenge.startDate)}</p>
		</div>

		<div>
			<h3 class="mb-2 font-mono text-xs tracking-widest text-gray-500 uppercase">End Date</h3>
			<p class="font-mono text-sm text-white">{formatDate(challenge.endDate)}</p>
		</div>

		<div>
			<h3 class="mb-2 font-mono text-xs tracking-widest text-gray-500 uppercase">Status</h3>
			<p class="font-mono text-sm text-white uppercase">{challenge.status}</p>
		</div>
	</div>
</div>
