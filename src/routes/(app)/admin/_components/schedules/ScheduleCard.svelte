<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { getFormActionError } from '$lib/utils/form-action.js';
	import type { RoutineScheduleAdmin } from '../../_logic/RoutineScheduleAdmin.svelte.js';
	import { getAdminContext } from '../../_logic/context.js';
	import AdminDeleteConfirmDialog from '../AdminDeleteConfirmDialog.svelte';

	type Props = {
		schedule: RoutineScheduleAdmin;
	};

	let { schedule }: Props = $props();
	let admin = getAdminContext();
	let isEditing = $state(false);
	let editDay = $derived(schedule.day);
	let editTime = $derived(schedule.time);
	let editLocation = $derived(schedule.location);
	let editAccentColor = $derived(schedule.accentColor);
	let editDescription = $derived(schedule.description);

	$effect(() => {
		if (!isEditing) {
			editDay = schedule.day;
			editTime = schedule.time;
			editLocation = schedule.location;
			editAccentColor = schedule.accentColor;
			editDescription = schedule.description;
		}
	});

	let showDeleteConfirm = $state(false);
	let isDeleting = $state(false);
	let deleteFormEl: HTMLFormElement | undefined = $state();

	const deleteDialogTitleId = $derived(`schedule-delete-title-${schedule.id}`);
	const deleteDialogDescId = $derived(`schedule-delete-desc-${schedule.id}`);

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
</script>

{#if isEditing}
	<form
		method="POST"
		action="?/updateRoutineSchedule"
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') {
					await update();
					isEditing = false;
				} else {
					const errorMsg = getFormActionError(result) ?? 'Failed to update schedule.';
					toast.error(errorMsg);
				}
			}}
		class="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4 border-l-4 {!schedule.isActive
			? 'opacity-60'
			: ''}"
		style="border-left-color: {schedule.accentColor};"
	>
		<input type="hidden" name="id" value={schedule.id} />
		<input
			type="text"
			name="day"
			bind:value={editDay}
			required
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		/>
		<input
			type="text"
			name="time"
			bind:value={editTime}
			required
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		/>
		<input
			type="text"
			name="location"
			bind:value={editLocation}
			required
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		/>
		<input
			type="text"
			name="accentColor"
			bind:value={editAccentColor}
			required
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		/>
		<textarea
			name="description"
			bind:value={editDescription}
			required
			rows="2"
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		></textarea>
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
	<div
		class="flex flex-col rounded-lg border border-white/10 bg-white/5 p-4 border-l-4 {!schedule.isActive
			? 'opacity-60'
			: ''}"
		style="border-left-color: {schedule.accentColor};"
	>
		<div class="flex items-start justify-between gap-2">
			<div>
				<h3 class="font-mono text-sm font-bold text-white uppercase">{schedule.day}</h3>
				<p class="mt-1 font-mono text-xs text-white/60">
					{schedule.time} · {schedule.location} · {schedule.isActive ? 'Active' : 'Inactive'}
				</p>
			</div>
			<form method="POST" action="?/toggleRoutineSchedule" use:enhance class="inline shrink-0">
				<input type="hidden" name="id" value={schedule.id} />
				<input type="hidden" name="isActive" value={schedule.isActive ? 'false' : 'true'} />
				<button type="submit" class="font-mono text-[10px] text-white/60 hover:text-white">
					{schedule.isActive ? 'Deactivate' : 'Activate'}
				</button>
			</form>
		</div>
		<p class="mt-2 line-clamp-2 font-mono text-xs text-white/70">{schedule.description}</p>
		<div class="mt-2 flex items-center gap-2">
			<button
				onclick={() => (isEditing = true)}
				class="font-mono text-[10px] text-(--accent-lime) hover:underline">Edit</button
			>
			<form
				bind:this={deleteFormEl}
				method="POST"
				action="?/deleteRoutineSchedule"
				use:enhance={() => {
					const id = schedule.id;
					admin.removeScheduleOptimistic(id);
					return async ({ result, update }) => {
						isDeleting = false;
						if (result.type === 'success') {
							await update();
						} else {
							const errorMsg = getFormActionError(result) ?? 'Failed to delete.';
							toast.error(errorMsg);
							await update();
						}
					};
				}}
				class="inline-flex"
			>
				<input type="hidden" name="id" value={schedule.id} />
				<button
					type="button"
					onclick={openDeleteConfirm}
					class="font-mono text-[10px] text-red-400 hover:underline">Delete</button
				>
			</form>
		</div>
	</div>

	<AdminDeleteConfirmDialog
		open={showDeleteConfirm}
		title="Delete schedule?"
		titleId={deleteDialogTitleId}
		descriptionId={deleteDialogDescId}
		busy={isDeleting}
		onclose={closeDeleteConfirm}
		onconfirm={submitDelete}
	>
		This will permanently remove <span class="font-bold text-white">{schedule.day}</span>
		({schedule.time} · {schedule.location}). This cannot be undone.
	</AdminDeleteConfirmDialog>
{/if}
