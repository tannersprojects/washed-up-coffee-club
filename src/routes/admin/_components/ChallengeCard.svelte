<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { CHALLENGE_TYPE, CHALLENGE_STATUS } from '$lib/constants';
	import type { ChallengeAdmin } from '../_logic/ChallengeAdmin.svelte.js';
	import { getAdminContext } from '../_logic/context.js';

	type Props = {
		challenge: ChallengeAdmin;
	};

	let { challenge }: Props = $props();
	let admin = getAdminContext();
	let isEditing = $state(false);
	let editTitle = $state(challenge.title);
	let editDescription = $state(challenge.description);
	let editType = $state(challenge.type);
	let editGoalValue = $state(challenge.goalValue?.toString() ?? '');
	let editSegmentId = $state(challenge.segmentId?.toString() ?? '');
	let editStartDate = $state(formatDatetimeLocal(challenge.startDate));
	let editEndDate = $state(formatDatetimeLocal(challenge.endDate));
	let editStatus = $state(challenge.status);

	$effect(() => {
		if (!isEditing) {
			editTitle = challenge.title;
			editDescription = challenge.description;
			editType = challenge.type;
			editGoalValue = challenge.goalValue?.toString() ?? '';
			editSegmentId = challenge.segmentId?.toString() ?? '';
			editStartDate = formatDatetimeLocal(challenge.startDate);
			editEndDate = formatDatetimeLocal(challenge.endDate);
			editStatus = challenge.status;
		}
	});

	function formatDatetimeLocal(d: Date): string {
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') {
					await update();
					isEditing = false;
				} else {
					toast.error(
						(result.type === 'failure' ? (result.data as { error?: string })?.error : undefined) ??
							'Failed to update challenge.'
					);
				}
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
		{#if editType === CHALLENGE_TYPE.CUMULATIVE || editType === CHALLENGE_TYPE.BEST_EFFORT}
			<input
				type="number"
				name="goalValue"
				bind:value={editGoalValue}
				min="1"
				class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
			/>
		{/if}
		{#if editType === CHALLENGE_TYPE.SEGMENT_RACE}
			<input
				type="number"
				name="segmentId"
				bind:value={editSegmentId}
				min="1"
				class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
			/>
		{/if}
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
					{typeLabels[challenge.type] ?? challenge.type} · {statusLabels[challenge.status] ??
						challenge.status}
				</p>
				<p class="mt-2 font-mono text-[10px] text-white/40">
					{challenge.startDate.toLocaleDateString()} – {challenge.endDate.toLocaleDateString()}
				</p>
				<p class="mt-1 font-mono text-[10px] text-white/40">
					{challenge.participantCount} participants
				</p>
			</div>
			<div class="flex gap-2">
				<button
					onclick={() => (isEditing = true)}
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
					class="inline"
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
