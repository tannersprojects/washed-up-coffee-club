<script lang="ts">
	import type { RoutineScheduleAdmin } from '../_logic/RoutineScheduleAdmin.svelte.js';
	import ScheduleCard from './ScheduleCard.svelte';

	type Props = {
		schedules: RoutineScheduleAdmin[];
	};

	let { schedules }: Props = $props();
</script>

<div class="flex flex-col gap-3">
	{#each schedules as schedule (schedule.id)}
		<ScheduleCard {schedule} />
	{/each}
</div>
