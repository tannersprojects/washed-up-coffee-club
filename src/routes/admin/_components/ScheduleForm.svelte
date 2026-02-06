<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { getAdminContext } from '../_logic/context.js';
	import { RoutineScheduleAdmin } from '../_logic/RoutineScheduleAdmin.svelte.js';

	let admin = getAdminContext();
	let day = $state('');
	let time = $state('');
	let location = $state('');
	let accentColor = $state('#22c55e');
	let description = $state('');
	let isSubmitting = $state(false);

	function resetForm() {
		day = '';
		time = '';
		location = '';
		accentColor = '#22c55e';
		description = '';
		isSubmitting = false;
	}
</script>

<form
	method="POST"
	action="?/createRoutineSchedule"
	use:enhance={({ formData }) => {
		if (!day.trim() || !time.trim() || !location.trim() || !description.trim()) return () => {};

		const id = crypto.randomUUID();
		formData.set('id', id);

		const optimistic = new RoutineScheduleAdmin({
			id,
			day: day.trim(),
			time: time.trim(),
			location: location.trim(),
			accentColor: accentColor.trim(),
			description: description.trim(),
			sortOrder: admin.routineSchedules.length,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		admin.addScheduleOptimistic(optimistic);
		isSubmitting = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update();
				resetForm();
			} else {
				admin.removeScheduleOptimistic(id);
				const message =
					(result.type === 'failure' ? (result.data as { error?: string })?.error : undefined) ??
					'Failed to create schedule.';
				toast.error(message);
			}
			isSubmitting = false;
		};
	}}
	class="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
>
	<div class="grid grid-cols-2 gap-3">
		<div class="flex flex-col gap-1">
			<label for="schedule-day" class="font-mono text-xs text-white/80">Day</label>
			<input
				id="schedule-day"
				type="text"
				name="day"
				bind:value={day}
				required
				maxlength="50"
				placeholder="e.g. Saturday"
				class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
			/>
		</div>
		<div class="flex flex-col gap-1">
			<label for="schedule-time" class="font-mono text-xs text-white/80">Time</label>
			<input
				id="schedule-time"
				type="text"
				name="time"
				bind:value={time}
				required
				maxlength="20"
				placeholder="e.g. 8:00 AM"
				class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
			/>
		</div>
	</div>
	<div class="flex flex-col gap-1">
		<label for="schedule-location" class="font-mono text-xs text-white/80">Location</label>
		<input
			id="schedule-location"
			type="text"
			name="location"
			bind:value={location}
			required
			maxlength="200"
			placeholder="e.g. Central Park"
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		/>
	</div>
	<div class="flex flex-col gap-1">
		<label for="schedule-accent" class="font-mono text-xs text-white/80">Accent Color</label>
		<input
			id="schedule-accent"
			type="text"
			name="accentColor"
			bind:value={accentColor}
			required
			maxlength="100"
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		/>
	</div>
	<div class="flex flex-col gap-1">
		<label for="schedule-desc" class="font-mono text-xs text-white/80">Description</label>
		<textarea
			id="schedule-desc"
			name="description"
			bind:value={description}
			required
			maxlength="500"
			rows="2"
			placeholder="Brief description..."
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		></textarea>
	</div>
	<button
		type="submit"
		disabled={isSubmitting ||
			!day.trim() ||
			!time.trim() ||
			!location.trim() ||
			!description.trim()}
		class="rounded bg-(--accent-lime) px-4 py-2 font-mono text-xs font-bold tracking-widest text-black uppercase disabled:cursor-not-allowed disabled:opacity-50"
	>
		{isSubmitting ? 'Adding...' : 'Add Schedule'}
	</button>
</form>
