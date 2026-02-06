<script lang="ts">
	import { getAdminContext } from '../_logic/context.js';
	import SchedulesList from './SchedulesList.svelte';
	import ScheduleForm from './ScheduleForm.svelte';

	let admin = getAdminContext();
	let schedules = $derived(admin.routineSchedules);
</script>

<section class="flex flex-col gap-6">
	<h2 class="font-mono text-sm font-bold tracking-widest text-white uppercase">
		Routine Schedules
	</h2>
	<ScheduleForm />
	<SchedulesList {schedules} />
</section>
