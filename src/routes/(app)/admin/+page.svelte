<script lang="ts">
	import { untrack } from 'svelte';
	import { setAdminContext } from './_logic/context.js';
	import {
		AdminTabs,
		MemoriesSection,
		SchedulesSection,
		ChallengesSection,
		ContentSection
	} from './_components';
	import { ADMIN_TAB } from '$lib/constants';

	let { data } = $props();

	const admin = untrack(() => setAdminContext(data));

	$effect(() => {
		admin.updateFromServerData(data);
	});
</script>

<div class="mx-auto w-full max-w-4xl px-6">
	<AdminTabs />
	{#if admin.activeTab === ADMIN_TAB.Memories}
		<MemoriesSection />
	{:else if admin.activeTab === ADMIN_TAB.Schedules}
		<SchedulesSection />
	{:else if admin.activeTab === ADMIN_TAB.Challenges}
		<ChallengesSection />
	{:else if admin.activeTab === ADMIN_TAB.Content}
		<ContentSection />
	{/if}
</div>
