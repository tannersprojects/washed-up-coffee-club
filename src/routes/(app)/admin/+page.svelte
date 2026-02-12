<script lang="ts">
	import { untrack } from 'svelte';
	import { setAdminContext } from './_logic/context.js';
	import type { AdminTab } from './_logic/AdminUI.svelte.js';
	import Tabs from '$lib/components/Tabs.svelte';
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
	<Tabs
		tabs={[
			{ value: 'memories', label: 'Memories' },
			{ value: 'schedules', label: 'Schedules' },
			{ value: 'challenges', label: 'Challenges' }
		]}
		value={admin.activeTab}
		onSelect={(v) => admin.setActiveTab(v as AdminTab)}
		class="mb-8"
	/>

	{#if admin.activeTab === 'memories'}
		<MemoriesSection />
	{:else if admin.activeTab === 'schedules'}
		<SchedulesSection />
	{:else if admin.activeTab === 'challenges'}
		<ChallengesSection />
	{/if}
</div>
