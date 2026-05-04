<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import {
		CHALLENGE_TYPE,
		CHALLENGE_STATUS,
		RANKING_METRIC,
		RANKING_METRIC_LABEL,
		RANKING_METRIC_VALUES,
		CHALLENGE_TYPES_WITH_GOAL_DISTANCE,
		DISTANCE_LABEL,
		DISTANCE_UNIT,
		type RankingMetric,
		type ChallengeStatus,
		type ChallengeType,
		type DistanceUnit
	} from '$lib/constants';
	import { getUserPreferencesContext } from '$lib/state/user-preferences.svelte.js';
	import { getChallengeTimeStateFromDates } from '$lib/utils/challenge.js';
	import { getFormActionError } from '$lib/utils/form-action.js';
	import { formatDatetimeForInput, formatDate } from '$lib/utils/datetime.js';
	import { kmToMeters, metersToKm, metersToMiles, milesToMeters } from '$lib/utils/distance.js';
	import type { ChallengeAdmin } from '../../_logic/ChallengeAdmin.svelte.js';
	import { getAdminContext } from '../../_logic/context.js';

	type Props = {
		challenge: ChallengeAdmin;
	};

	function metersToDisplayValue(m: number | null, u: DistanceUnit): string {
		if (m == null) return '';
		return u === DISTANCE_UNIT.MILES ? metersToMiles(m).toFixed(1) : metersToKm(m).toFixed(1);
	}

	let { challenge }: Props = $props();
	let admin = getAdminContext();
	const prefs = getUserPreferencesContext();
	const unit = $derived(prefs.distanceUnit);

	let isEditing = $state(false);
	let editTitle = $state('');
	let editDescription = $state('');
	let editType = $state<ChallengeType>(CHALLENGE_TYPE.CUMULATIVE);
	let editGoalDistance = $state('');
	let editSegmentId = $state('');
	let editRankingMetric = $state<RankingMetric>(RANKING_METRIC.NONE);
	let editStartDate = $state('');
	let editEndDate = $state('');
	let editStatus = $state<ChallengeStatus>(CHALLENGE_STATUS.UPCOMING);

	function startEditing() {
		editTitle = challenge.title;
		editDescription = challenge.description;
		editType = challenge.type as ChallengeType;
		editGoalDistance = metersToDisplayValue(challenge.goalDistance, unit);
		editSegmentId = challenge.segmentId?.toString() ?? '';
		editRankingMetric = challenge.rankingMetric;
		editStartDate = formatDatetimeForInput(challenge.startDate);
		editEndDate = formatDatetimeForInput(challenge.endDate);
		editStatus = challenge.status as ChallengeStatus;
		isEditing = true;
	}

	const rankingMetricOptions: Array<{ value: RankingMetric; label: string }> =
		RANKING_METRIC_VALUES.map((value) => ({ value, label: RANKING_METRIC_LABEL[value] }));

	const typeLabels: Record<string, string> = {
		[CHALLENGE_TYPE.CUMULATIVE]: 'Cumulative',
		[CHALLENGE_TYPE.BEST_EFFORT]: 'Best Effort',
		[CHALLENGE_TYPE.SEGMENT_RACE]: 'Segment Race'
	};
	const statusLabels: Record<string, string> = {
		[CHALLENGE_STATUS.UPCOMING]: 'Upcoming',
		[CHALLENGE_STATUS.ACTIVE]: 'Active',
		[CHALLENGE_STATUS.COMPLETED]: 'Completed'
	};

	let showDeleteConfirm = $state(false);
	let isDeleting = $state(false);
	let deleteFormEl: HTMLFormElement | undefined = $state();
	let deleteCancelButtonEl: HTMLButtonElement | undefined = $state();

	const deleteDialogTitleId = $derived(`challenge-delete-title-${challenge.id}`);
	const deleteDialogDescId = $derived(`challenge-delete-desc-${challenge.id}`);

	function openDeleteConfirm() {
		showDeleteConfirm = true;
	}

	function closeDeleteConfirm() {
		if (isDeleting) return;
		showDeleteConfirm = false;
	}

	function submitDelete() {
		if (!deleteFormEl || isDeleting) return;
		isDeleting = true;
		showDeleteConfirm = false;
		deleteFormEl.requestSubmit();
	}

	$effect(() => {
		if (!showDeleteConfirm) return;

		void tick().then(() => {
			deleteCancelButtonEl?.focus();
		});

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				closeDeleteConfirm();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	});
</script>

{#if isEditing}
	<form
		method="POST"
		action="?/updateChallenge"
		use:enhance={({ formData }) => {
			if (CHALLENGE_TYPES_WITH_GOAL_DISTANCE.includes(editType)) {
				const displayVal = parseFloat(editGoalDistance);
				const meters =
					unit === DISTANCE_UNIT.MILES ? milesToMeters(displayVal) : kmToMeters(displayVal);
				formData.set('goalDistance', String(meters));
			}
			return async ({ result, update }) => {
				if (result.type === 'success') {
					await update();
					isEditing = false;
				} else {
					const errorMsg = getFormActionError(result) ?? 'Failed to update challenge.';
					toast.error(errorMsg);
				}
			};
		}}
		class="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
	>
		<input type="hidden" name="id" value={challenge.id} />
		<input
			type="text"
			name="title"
			bind:value={editTitle}
			required
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		/>
		<textarea
			name="description"
			bind:value={editDescription}
			rows="2"
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		></textarea>
		<select
			name="type"
			bind:value={editType}
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		>
			<option value={CHALLENGE_TYPE.CUMULATIVE}>Cumulative</option>
			<option value={CHALLENGE_TYPE.BEST_EFFORT}>Best Effort</option>
			<option value={CHALLENGE_TYPE.SEGMENT_RACE}>Segment Race</option>
		</select>
		<select
			name="rankingMetric"
			bind:value={editRankingMetric}
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		>
			{#each rankingMetricOptions as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
		{#if editType === CHALLENGE_TYPE.SEGMENT_RACE}
			<p class="font-mono text-[10px] text-white/50">Stored but not used for scoring in v1.</p>
		{/if}
		{#if CHALLENGE_TYPES_WITH_GOAL_DISTANCE.includes(editType)}
			<div class="flex flex-col gap-1">
				<label for="edit-goal" class="font-mono text-xs text-white/80"
					>Goal Distance ({DISTANCE_LABEL[unit]})</label
				>
				<input
					id="edit-goal"
					type="number"
					name="goalDistance"
					bind:value={editGoalDistance}
					min="0.1"
					step="0.1"
					class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
				/>
			</div>
		{/if}
		{#if editType === CHALLENGE_TYPE.SEGMENT_RACE}
			<div class="flex flex-col gap-1">
				<label for="edit-segment" class="font-mono text-xs text-white/80">Segment ID</label>
				<input
					id="edit-segment"
					type="number"
					name="segmentId"
					bind:value={editSegmentId}
					min="1"
					class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
				/>
			</div>
		{/if}
		<p class="font-mono text-[10px] text-white/50">Dates in Eastern Time (EST/EDT)</p>
		<input
			type="datetime-local"
			name="startDate"
			bind:value={editStartDate}
			required
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		/>
		<input
			type="datetime-local"
			name="endDate"
			bind:value={editEndDate}
			required
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		/>
		<select
			name="status"
			bind:value={editStatus}
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		>
			<option value={CHALLENGE_STATUS.UPCOMING}>Upcoming</option>
			<option value={CHALLENGE_STATUS.ACTIVE}>Active</option>
			<option value={CHALLENGE_STATUS.COMPLETED}>Completed</option>
		</select>
		<div class="flex gap-2">
			<button
				type="submit"
				class="rounded bg-(--accent-lime) px-3 py-1 font-mono text-xs font-bold text-black uppercase"
				>Save</button
			>
			<button
				type="button"
				onclick={() => (isEditing = false)}
				class="rounded border border-white/20 px-3 py-1 font-mono text-xs text-white/80"
				>Cancel</button
			>
		</div>
	</form>
{:else}
	<div class="rounded-lg border border-white/10 bg-white/5 p-4">
		<div class="flex items-start justify-between gap-2">
			<div>
				<h3 class="font-mono text-sm font-bold text-white">{challenge.title}</h3>
				<p class="mt-1 font-mono text-xs text-white/60">
					{typeLabels[challenge.type] ?? challenge.type} ·
					{statusLabels[
						getChallengeTimeStateFromDates(challenge.startDate, challenge.endDate).status
					]}
				</p>
				<p class="mt-2 font-mono text-[10px] text-white/40">
					{formatDate(challenge.startDate)} – {formatDate(challenge.endDate)}
				</p>
				<p class="mt-1 font-mono text-[10px] text-white/40">
					{challenge.participantCount} participants
				</p>
			</div>
			<div class="flex items-center gap-2">
				<button
					onclick={startEditing}
					class="font-mono text-[10px] text-(--accent-lime) hover:underline">Edit</button
				>
				<form
					bind:this={deleteFormEl}
					method="POST"
					action="?/deleteChallenge"
					use:enhance={() => {
						const id = challenge.id;
						admin.removeChallengeOptimistic(id);
						return async ({ result, update }) => {
							isDeleting = false;
							if (result.type === 'success') {
								await update();
							} else {
								toast.error(getFormActionError(result) ?? 'Failed to delete.');
								await update();
							}
						};
					}}
					class="inline-flex"
				>
					<input type="hidden" name="id" value={challenge.id} />
					<button
						type="button"
						onclick={openDeleteConfirm}
						class="font-mono text-[10px] text-red-400 hover:underline">Delete</button
					>
				</form>
			</div>
		</div>
		{#if challenge.description}
			<p class="mt-2 line-clamp-2 font-mono text-xs text-white/70">{challenge.description}</p>
		{/if}
	</div>

	{#if showDeleteConfirm}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				class="absolute inset-0 cursor-default bg-black/70"
				aria-label="Close dialog"
				onclick={closeDeleteConfirm}
			></button>
			<div
				role="dialog"
				tabindex="-1"
				aria-modal="true"
				aria-labelledby={deleteDialogTitleId}
				aria-describedby={deleteDialogDescId}
				class="relative z-10 w-full max-w-md rounded-lg border border-white/10 bg-black/90 p-4 shadow-xl outline-none backdrop-blur-sm"
			>
				<h2 id={deleteDialogTitleId} class="font-mono text-sm font-bold text-white">
					Delete challenge?
				</h2>
				<p id={deleteDialogDescId} class="mt-2 font-mono text-xs text-white/70">
					This will permanently remove <span class="font-bold text-white">{challenge.title}</span>
					{#if challenge.participantCount > 0}
						({challenge.participantCount} participants joined).
					{:else}
						.
					{/if}
					This cannot be undone.
				</p>
				<div class="mt-4 flex justify-end gap-2">
					<button
						bind:this={deleteCancelButtonEl}
						type="button"
						onclick={closeDeleteConfirm}
						class="rounded border border-white/20 px-3 py-1.5 font-mono text-xs text-white/80 hover:bg-white/5"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={isDeleting}
						onclick={submitDelete}
						class="rounded bg-red-600 px-3 py-1.5 font-mono text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
