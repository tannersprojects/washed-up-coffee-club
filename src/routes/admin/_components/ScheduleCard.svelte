<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import type { RoutineScheduleAdmin } from '../_logic/RoutineScheduleAdmin.svelte.js';
	import { getAdminContext } from '../_logic/context.js';

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
					toast.error(
						(result.type === 'failure' ? (result.data as { error?: string })?.error : undefined) ??
							'Failed to update schedule.'
					);
				}
			}}
		class="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
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
		class="flex flex-col rounded-lg border p-4 {!schedule.isActive
			? 'border-white/10 opacity-60'
			: ''}"
		style="border-color: {schedule.accentColor}40;"
	>
		<div class="flex items-center justify-between gap-2">
			<span
				class="font-mono text-sm font-bold text-white uppercase"
				style="color: {schedule.accentColor};">{schedule.day}</span
			>
			<form method="POST" action="?/toggleRoutineSchedule" use:enhance class="inline">
				<input type="hidden" name="id" value={schedule.id} />
				<input type="hidden" name="isActive" value={schedule.isActive ? 'false' : 'true'} />
				<button type="submit" class="font-mono text-[10px] text-white/60 hover:text-white">
					{schedule.isActive ? 'Deactivate' : 'Activate'}
				</button>
			</form>
		</div>
		<p class="font-mono text-xs text-white/80">{schedule.time} · {schedule.location}</p>
		<p class="mt-2 font-mono text-[10px] text-white/60">{schedule.description}</p>
		<div class="mt-2 flex gap-2">
			<button
				onclick={() => (isEditing = true)}
				class="font-mono text-[10px] text-(--accent-lime) hover:underline">Edit</button
			>
			<form
				method="POST"
				action="?/deleteRoutineSchedule"
				use:enhance={() => {
					const id = schedule.id;
					admin.removeScheduleOptimistic(id);
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
				<input type="hidden" name="id" value={schedule.id} />
				<button type="submit" class="font-mono text-[10px] text-red-400 hover:underline"
					>Delete</button
				>
			</form>
		</div>
	</div>
{/if}
