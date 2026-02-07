<script lang="ts">
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

<DashboardFooter />
