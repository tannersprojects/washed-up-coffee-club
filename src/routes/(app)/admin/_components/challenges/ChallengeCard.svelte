<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import {
		CHALLENGE_TYPE,
		CHALLENGE_STATUS,
		CHALLENGE_TYPES_WITH_GOAL_DISTANCE,
		DISTANCE_LABEL,
		DISTANCE_UNIT,
		type ChallengeStatus,
		type ChallengeType,
		type DistanceUnit
	} from '$lib/constants';
	import { getUserPreferencesContext } from '$lib/state/user-preferences.svelte.js';
	import { getChallengeTimeStateFromDates } from '$lib/utils/challenge.js';
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
	let editStartDate = $state('');
	let editEndDate = $state('');
	let editStatus = $state<ChallengeStatus>(CHALLENGE_STATUS.UPCOMING);

	function startEditing() {
		editTitle = challenge.title;
		editDescription = challenge.description;
		editType = challenge.type as ChallengeType;
		editGoalDistance = metersToDisplayValue(challenge.goalDistance, unit);
		editSegmentId = challenge.segmentId?.toString() ?? '';
		editStartDate = formatDatetimeForInput(challenge.startDate);
		editEndDate = formatDatetimeForInput(challenge.endDate);
		editStatus = challenge.status as ChallengeStatus;
		isEditing = true;
	}

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
					toast.error(
						(result.type === 'failure' ? (result.data as { error?: string })?.error : undefined) ??
							'Failed to update challenge.'
					);
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
					method="POST"
					action="?/deleteChallenge"
					use:enhance={() => {
						const id = challenge.id;
						admin.removeChallengeOptimistic(id);
						return async ({ result, update }) => {
							if (result.type === 'success') {
								await update();
							} else {
								toast.error(
									(result.type === 'failure'
										? (result.data as { error?: string })?.error
										: undefined) ?? 'Failed to delete.'
								);
								await update();
							}
						};
					}}
					class="inline-flex"
				>
					<input type="hidden" name="id" value={challenge.id} />
					<button type="submit" class="font-mono text-[10px] text-red-400 hover:underline"
						>Delete</button
					>
				</form>
			</div>
		</div>
		{#if challenge.description}
			<p class="mt-2 line-clamp-2 font-mono text-xs text-white/70">{challenge.description}</p>
		{/if}
	</div>
{/if}
