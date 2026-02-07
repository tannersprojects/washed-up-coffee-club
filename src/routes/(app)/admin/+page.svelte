<script lang="ts">
	import { untrack } from 'svelte';
	import { setAdminContext } from './_logic/context.js';
	import AdminTabs from './_components/AdminTabs.svelte';
	import MemoriesSection from './_components/MemoriesSection.svelte';
	import SchedulesSection from './_components/SchedulesSection.svelte';
	import ChallengesSection from './_components/ChallengesSection.svelte';

	let { data } = $props();

	const admin = untrack(() => setAdminContext(data));

	$effect(() => {
		admin.updateFromServerData(data);
	});
</script>

<div class="mx-auto w-full max-w-4xl px-6">
	<div class="mb-8">
		<AdminTabs activeTab={admin.activeTab} onTabChange={(tab) => admin.setActiveTab(tab)} />
	</div>

	{#if admin.activeTab === 'memories'}
		<MemoriesSection />
	{:else if admin.activeTab === 'schedules'}
		<SchedulesSection />
	{:else if admin.activeTab === 'challenges'}
		<ChallengesSection />
	{/if}
</div>
