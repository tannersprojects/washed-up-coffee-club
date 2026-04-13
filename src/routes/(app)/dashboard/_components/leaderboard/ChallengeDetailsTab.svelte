<script lang="ts">
	import { formatDate } from '$lib/utils/datetime.js';
	import { formatDistanceDisplay } from '$lib/utils/distance.js';
	import { getDashboardContext } from '../../_logic/context.js';

	const dashboard = getDashboardContext();
	const challenge = $derived(dashboard.selectedChallenge);
	const unit = $derived(dashboard.distanceUnit);
	const goalDistanceDisplay = $derived(
		challenge?.goalDistance ? formatDistanceDisplay(challenge.goalDistance, unit) : null
	);
</script>

{#if challenge}
	<div class="space-y-8 py-8">
		<div class="space-y-4">
			<h2 class="text-2xl font-bold text-white uppercase">Challenge Details</h2>

			{#if challenge.description}
				<div>
					<h3 class="mb-2 font-mono text-xs tracking-widest text-gray-500 uppercase">
						Description
					</h3>
					<p class="text-white">{challenge.description}</p>
				</div>
			{/if}

			<div>
				<h3 class="mb-2 font-mono text-xs tracking-widest text-gray-500 uppercase">
					Challenge Type
				</h3>
				<p class="font-mono text-sm text-white uppercase">{challenge.type}</p>
			</div>

			{#if goalDistanceDisplay}
				<div>
					<h3 class="mb-2 font-mono text-xs tracking-widest text-gray-500 uppercase">
						Goal Distance
					</h3>
					<p class="font-mono text-2xl font-bold text-white">{goalDistanceDisplay}</p>
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
				<p class="flex items-center gap-2 font-mono text-sm text-white uppercase">
					<span class="h-2 w-2 shrink-0 rounded-full {challenge.statusDotColor}"></span>
					{challenge.challengeTimeState.status}
				</p>
			</div>
		</div>
	</div>
{/if}
