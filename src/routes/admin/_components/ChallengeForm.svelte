<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import {
		CHALLENGE_TYPE,
		CHALLENGE_STATUS,
		type ChallengeType,
		type ChallengeStatus
	} from '$lib/constants';
	import { getAdminContext } from '../_logic/context.js';
	import { ChallengeAdmin } from '../_logic/ChallengeAdmin.svelte.js';

	let admin = getAdminContext();
	let title = $state('');
	let description = $state('');
	let type = $state<ChallengeType>(CHALLENGE_TYPE.CUMULATIVE);
	let goalValue = $state<string>('');
	let segmentId = $state<string>('');
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

	function resetForm() {
		title = '';
		description = '';
		type = CHALLENGE_TYPE.CUMULATIVE;
		goalValue = '';
		segmentId = '';
		startDate = '';
		endDate = '';
		status = CHALLENGE_STATUS.UPCOMING;
		isSubmitting = false;
	}

	let canSubmit = $derived(
		!!title.trim() &&
			!!startDate &&
			!!endDate &&
			(type !== CHALLENGE_TYPE.CUMULATIVE && type !== CHALLENGE_TYPE.BEST_EFFORT
				? !!goalValue && parseInt(goalValue, 10) > 0
				: true) &&
			(type !== CHALLENGE_TYPE.SEGMENT_RACE ? true : !!segmentId && parseInt(segmentId, 10) > 0)
	);
</script>

<form
	method="POST"
	action="?/createChallenge"
	use:enhance={({ formData }) => {
		const id = crypto.randomUUID();
		formData.set('id', id);

		const start = startDate ? new Date(startDate) : new Date();
		const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		const gv = goalValue ? parseInt(goalValue, 10) : null;
		const segId = segmentId ? parseInt(segmentId, 10) : null;

		const optimistic = new ChallengeAdmin({
			id,
			title: title.trim(),
			description: description.trim(),
			type,
			goalValue: gv ?? null,
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
				toast.error(
					(result.type === 'failure' ? (result.data as { error?: string })?.error : undefined) ??
						'Failed to create challenge.'
				);
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
	{#if type === CHALLENGE_TYPE.CUMULATIVE || type === CHALLENGE_TYPE.BEST_EFFORT}
		<div class="flex flex-col gap-1">
			<label for="challenge-goal" class="font-mono text-xs text-white/80"
				>Goal Value (meters/sec)</label
			>
			<input
				id="challenge-goal"
				type="number"
				name="goalValue"
				bind:value={goalValue}
				required={type === CHALLENGE_TYPE.CUMULATIVE || type === CHALLENGE_TYPE.BEST_EFFORT}
				min="1"
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
