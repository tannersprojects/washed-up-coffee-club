<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import {
		CHALLENGE_TYPE,
		CHALLENGE_STATUS,
		RANKING_METRIC,
		CHALLENGE_TYPES_WITH_GOAL_DISTANCE,
		DISTANCE_LABEL,
		DISTANCE_UNIT,
		type ChallengeType,
		type ChallengeStatus,
		type RankingMetric
	} from '$lib/constants';
	import { getAdminContext } from '../../_logic/context.js';
	import { getUserPreferencesContext } from '$lib/state/user-preferences.svelte.js';
	import { ChallengeAdmin } from '../../_logic/ChallengeAdmin.svelte.js';
	import { getFormActionError } from '$lib/utils/form-action.js';
	import { parseEasternToUtc } from '$lib/utils/datetime.js';
	import { kmToMeters, milesToMeters } from '$lib/utils/distance.js';

	let admin = getAdminContext();
	const prefs = getUserPreferencesContext();
	const unit = $derived(prefs.distanceUnit);

	let title = $state('');
	let description = $state('');
	let type = $state<ChallengeType>(CHALLENGE_TYPE.CUMULATIVE);
	let goalDistance = $state<string>('');
	let segmentId = $state<string>('');
	let rankingMetric = $state<RankingMetric>(RANKING_METRIC.NONE);
	let startDate = $state('');
	let endDate = $state('');
	let status = $state<ChallengeStatus>(CHALLENGE_STATUS.UPCOMING);
	let isSubmitting = $state(false);

	const typeOptions = [
		{ value: CHALLENGE_TYPE.CUMULATIVE, label: 'Cumulative' },
		{ value: CHALLENGE_TYPE.BEST_EFFORT, label: 'Best Effort' },
		{ value: CHALLENGE_TYPE.SEGMENT_RACE, label: 'Segment Race' }
	] as const;

	const statusOptions = [
		{ value: CHALLENGE_STATUS.UPCOMING, label: 'Upcoming' },
		{ value: CHALLENGE_STATUS.ACTIVE, label: 'Active' },
		{ value: CHALLENGE_STATUS.COMPLETED, label: 'Completed' }
	] as const;

	const rankingMetricOptions: Array<{ value: RankingMetric; label: string }> = [
		{ value: RANKING_METRIC.NONE, label: 'None (unranked)' },
		{ value: RANKING_METRIC.ACTIVITY_TOTAL, label: 'Activity total moving time' },
		{ value: RANKING_METRIC.STANDARD_400M, label: '400m' },
		{ value: RANKING_METRIC.STANDARD_800M, label: '800m (1/2 mile)' },
		{ value: RANKING_METRIC.STANDARD_1K, label: '1K' },
		{ value: RANKING_METRIC.STANDARD_1_MILE, label: '1 mile' },
		{ value: RANKING_METRIC.STANDARD_2_MILE, label: '2 mile' },
		{ value: RANKING_METRIC.STANDARD_5K, label: '5K' },
		{ value: RANKING_METRIC.STANDARD_10K, label: '10K' },
		{ value: RANKING_METRIC.STANDARD_15K, label: '15K' },
		{ value: RANKING_METRIC.STANDARD_10_MILE, label: '10 mile' },
		{ value: RANKING_METRIC.STANDARD_20K, label: '20K' },
		{ value: RANKING_METRIC.STANDARD_HALF_MARATHON, label: 'Half marathon' },
		{ value: RANKING_METRIC.STANDARD_30K, label: '30K' },
		{ value: RANKING_METRIC.STANDARD_MARATHON, label: 'Marathon' },
		{ value: RANKING_METRIC.STANDARD_50K, label: '50K' }
	];

	function resetForm() {
		title = '';
		description = '';
		type = CHALLENGE_TYPE.CUMULATIVE;
		goalDistance = '';
		segmentId = '';
		rankingMetric = RANKING_METRIC.NONE;
		startDate = '';
		endDate = '';
		status = CHALLENGE_STATUS.UPCOMING;
		isSubmitting = false;
	}

	let canSubmit = $derived(
		!!title.trim() &&
			!!startDate &&
			!!endDate &&
			(CHALLENGE_TYPES_WITH_GOAL_DISTANCE.includes(type)
				? !!goalDistance && parseFloat(goalDistance) > 0
				: true) &&
			(type === CHALLENGE_TYPE.SEGMENT_RACE ? !!segmentId && parseInt(segmentId, 10) > 0 : true)
	);
</script>

<form
	method="POST"
	action="?/createChallenge"
	use:enhance={({ formData }) => {
		const id = crypto.randomUUID();
		formData.set('id', id);

		const start = startDate ? (parseEasternToUtc(startDate) ?? new Date()) : new Date();
		const end = endDate
			? (parseEasternToUtc(endDate) ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
			: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		const isDistanceType = CHALLENGE_TYPES_WITH_GOAL_DISTANCE.includes(type);
		const displayVal = isDistanceType && goalDistance ? parseFloat(goalDistance) : null;
		const meters =
			displayVal != null
				? unit === DISTANCE_UNIT.MILES
					? milesToMeters(displayVal)
					: kmToMeters(displayVal)
				: null;
		formData.set('goalDistance', isDistanceType && meters != null ? String(meters) : '');
		const segId = segmentId ? parseInt(segmentId, 10) : null;

		const optimistic = new ChallengeAdmin({
			id,
			title: title.trim(),
			description: description.trim(),
			type,
			rankingMetric,
			goalDistance: meters ?? null,
			segmentId: segId ?? null,
			startDate: start,
			endDate: end,
			status,
			isActive: status === CHALLENGE_STATUS.ACTIVE,
			createdAt: new Date(),
			updatedAt: new Date(),
			participants: []
		});
		admin.addChallengeOptimistic(optimistic);
		isSubmitting = true;

		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update();
				resetForm();
			} else {
				admin.removeChallengeOptimistic(id);
				const errorMsg = getFormActionError(result) ?? 'Failed to create challenge.';
				toast.error(errorMsg);
			}
			isSubmitting = false;
		};
	}}
	class="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/5 p-4"
>
	<div class="flex flex-col gap-1">
		<label for="challenge-title" class="font-mono text-xs text-white/80">Title</label>
		<input
			id="challenge-title"
			type="text"
			name="title"
			bind:value={title}
			required
			maxlength="200"
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		/>
	</div>
	<div class="flex flex-col gap-1">
		<label for="challenge-desc" class="font-mono text-xs text-white/80">Description</label>
		<textarea
			id="challenge-desc"
			name="description"
			bind:value={description}
			rows="3"
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		></textarea>
	</div>
	<div class="flex flex-col gap-1">
		<label for="challenge-type" class="font-mono text-xs text-white/80">Type</label>
		<select
			id="challenge-type"
			name="type"
			bind:value={type}
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		>
			{#each typeOptions as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</div>
	<div class="flex flex-col gap-1">
		<label for="challenge-ranking-metric" class="font-mono text-xs text-white/80"
			>Ranking Metric</label
		>
		<select
			id="challenge-ranking-metric"
			name="rankingMetric"
			bind:value={rankingMetric}
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		>
			{#each rankingMetricOptions as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
		{#if type === CHALLENGE_TYPE.SEGMENT_RACE}
			<p class="font-mono text-[10px] text-white/50">Stored but not used for scoring in v1.</p>
		{/if}
	</div>
	{#if CHALLENGE_TYPES_WITH_GOAL_DISTANCE.includes(type)}
		<div class="flex flex-col gap-1">
			<label for="challenge-goal" class="font-mono text-xs text-white/80"
				>Goal Distance ({DISTANCE_LABEL[unit]})</label
			>
			<input
				id="challenge-goal"
				type="number"
				name="goalDistance"
				bind:value={goalDistance}
				required={CHALLENGE_TYPES_WITH_GOAL_DISTANCE.includes(type)}
				min="0.1"
				step="0.1"
				class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
			/>
		</div>
	{/if}
	{#if type === CHALLENGE_TYPE.SEGMENT_RACE}
		<div class="flex flex-col gap-1">
			<label for="challenge-segment" class="font-mono text-xs text-white/80">Segment ID</label>
			<input
				id="challenge-segment"
				type="number"
				name="segmentId"
				bind:value={segmentId}
				required
				min="1"
				class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
			/>
		</div>
	{/if}
	<div class="grid grid-cols-2 gap-3">
		<p class="col-span-2 font-mono text-[10px] text-white/50">Dates in Eastern Time (EST/EDT)</p>
		<div class="flex flex-col gap-1">
			<label for="challenge-start" class="font-mono text-xs text-white/80">Start Date</label>
			<input
				id="challenge-start"
				type="datetime-local"
				name="startDate"
				bind:value={startDate}
				required
				class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
			/>
		</div>
		<div class="flex flex-col gap-1">
			<label for="challenge-end" class="font-mono text-xs text-white/80">End Date</label>
			<input
				id="challenge-end"
				type="datetime-local"
				name="endDate"
				bind:value={endDate}
				required
				class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
			/>
		</div>
	</div>
	<div class="flex flex-col gap-1">
		<label for="challenge-status" class="font-mono text-xs text-white/80">Status</label>
		<select
			id="challenge-status"
			name="status"
			bind:value={status}
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		>
			{#each statusOptions as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</div>
	<button
		type="submit"
		disabled={isSubmitting || !canSubmit}
		class="rounded bg-(--accent-lime) px-4 py-2 font-mono text-xs font-bold tracking-widest text-black uppercase disabled:cursor-not-allowed disabled:opacity-50"
	>
		{isSubmitting ? 'Creating...' : 'Create Challenge'}
	</button>
</form>
