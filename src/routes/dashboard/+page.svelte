<script lang="ts">
	import { initDashboardUI, getDashboardUI } from './_logic/DashboardUI.svelte.js';
	import { onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import DashboardNav from './_components/DashboardNav.svelte';
	import ChallengeHero from './_components/ChallengeHero.svelte';
	import LeaderboardSection from './_components/LeaderboardSection.svelte';
	import ChallengesList from './_components/ChallengesList.svelte';
	import EmptyState from './_components/EmptyState.svelte';

	// --- DATA FROM SERVER ---
	let { data } = $props();

	// Initialize Dashboard context
	const dashboard = initDashboardUI({
		challenges: data.challenges || [],
		leaderboards: data.leaderboards || {}
	});

	// Form submission handler
	const handleJoinChallenge = () => {
		return async ({
			result,
			update
		}: {
			result: { type: 'success' | 'failure' | 'redirect' | 'error' };
			update: (options?: { reset?: boolean }) => Promise<void>;
		}) => {
			await dashboard.handleJoinChallenge(async () => {
				await update();
				if (result.type === 'success') {
					await invalidateAll();
				}
			});
		};
	};

	// Cleanup on unmount
	onDestroy(() => {
		dashboard.cleanup();
	});
</script>

<!-- GLOBAL WRAPPER -->
<div
	class="min-h-screen w-full bg-[#050505] font-sans text-white selection:bg-(--accent-lime) selection:text-black"
>
	<DashboardNav profile={data.profile} />

	<main class="relative pt-24 pb-20">
		{#if dashboard.challenges.length === 0}
			<!-- Empty state - no challenges -->
			<EmptyState
				title="No Active Challenge"
				message="Check back later for the next event."
				variant="no-challenge"
			/>
		{:else if dashboard.challenges.length === 1}
			<!-- Single challenge view -->
			{#if dashboard.selectedChallenge && dashboard.selectedLeaderboard}
				<form method="POST" action="?/joinChallenge" use:enhance={handleJoinChallenge}>
					<input type="hidden" name="challengeId" value={dashboard.selectedChallenge.id} />
					<ChallengeHero />
				</form>
				<LeaderboardSection />
			{/if}
		{:else}
			<!-- Multiple challenges view -->
			<ChallengesList />

			<!-- Selected challenge detail view -->
			{#if dashboard.selectedChallenge && dashboard.selectedLeaderboard}
				<div class="mt-12">
					<form method="POST" action="?/joinChallenge" use:enhance={handleJoinChallenge}>
						<input type="hidden" name="challengeId" value={dashboard.selectedChallenge.id} />
						<ChallengeHero />
					</form>
					<LeaderboardSection />
				</div>
			{/if}
		{/if}
	</main>
</div>
