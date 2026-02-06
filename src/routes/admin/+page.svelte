<script lang="ts">
	import { untrack } from 'svelte';
	import { setAdminContext } from './_logic/context.js';
	import AdminNav from './_components/AdminNav.svelte';
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

<div
	class="flex min-h-screen w-full flex-col bg-[#050505] font-sans text-white selection:bg-(--accent-lime) selection:text-black"
>
	<AdminNav profile={data.profile} />

	<main class="relative flex flex-1 flex-col pt-24 pb-20">
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
	</main>
</div>
