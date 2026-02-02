<script lang="ts">
	import DashboardNav from './_components/DashboardNav.svelte';
	import ChallengeHero from './_components/ChallengeHero.svelte';
	import LeaderboardSection from './_components/LeaderboardSection.svelte';
	import ChallengesList from './_components/ChallengesList.svelte';
	import EmptyState from './_components/EmptyState.svelte';
	import DashboardFooter from './_components/DashboardFooter.svelte';
	import { untrack } from 'svelte';
	import { setDashboardContext } from './_logic/context.js';

	// --- DATA FROM SERVER ---
	let { data } = $props();

	// Initialize Dashboard context - only set once
	const dashboard = untrack(() => setDashboardContext(data));

	// Sync dashboard when server data changes (e.g., after form submission)
	$effect(() => {
		dashboard.updateFromServerData(data);
	});
</script>

<!-- GLOBAL WRAPPER: flex column so main grows and footer stays at bottom -->
<div
	class="flex min-h-screen w-full flex-col bg-[#050505] font-sans text-white selection:bg-(--accent-lime) selection:text-black"
>
	<DashboardNav profile={data.profile} />

	<main class="relative flex flex-1 flex-col pt-24 pb-20">
		{#if dashboard.challenges.length === 0}
			<!-- Empty state - no challenges -->
			<EmptyState
				title="No Active Challenge"
				message="Check back later for the next event."
				variant="no-challenge"
			/>
		{:else}
			{#if dashboard.challenges.length > 1}
				<!-- Multiple challenges view -->
				<ChallengesList />
			{/if}
			<!-- Single challenge view -->
			{#if dashboard.selectedChallenge}
				<ChallengeHero />
				<LeaderboardSection />
			{/if}
		{/if}
	</main>

	<DashboardFooter />
</div>
