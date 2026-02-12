<script lang="ts">
	import { untrack } from 'svelte';
	import { setAdminContext } from './_logic/context.js';
	import AdminTabs from './_components/AdminTabs.svelte';
	import MemoriesSection from './_components/MemoriesSection.svelte';
	import SchedulesSection from './_components/SchedulesSection.svelte';
	import ChallengesSection from './_components/ChallengesSection.svelte';
	import { AdminTabValue } from '$lib/types/admin.js';

	let { data } = $props();

	const admin = untrack(() => setAdminContext(data));

	$effect(() => {
		admin.updateFromServerData(data);
	});
</script>

<div class="mx-auto w-full max-w-4xl px-6">
	<AdminTabs />
	{#if admin.activeTab === AdminTabValue.Memories}
		<MemoriesSection />
	{:else if admin.activeTab === AdminTabValue.Schedules}
		<SchedulesSection />
	{:else if admin.activeTab === AdminTabValue.Challenges}
		<ChallengesSection />
	{/if}
</div>
