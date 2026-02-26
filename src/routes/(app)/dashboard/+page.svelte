<script lang="ts">
	import { untrack } from 'svelte';
	import { DASHBOARD_TAB } from '$lib/constants';

	import {
		ChallengesDrawer,
		DashboardChallengesSidebar,
		ChallengeHero,
		LeaderboardSection,
		EmptyState,
		DashboardFooter,
		DashboardTabs
	} from './_components';
	import { setDashboardContext } from './_logic/context.js';
	import { Menu } from 'lucide-svelte';

	let { data } = $props();

	// Initialize Dashboard context - only set once
	const dashboard = untrack(() => setDashboardContext(data));

	// Sync dashboard when server data changes (e.g., after form submission)
	$effect(() => {
		dashboard.updateFromServerData(data);
	});
</script>

<!-- Outer wrapper: fill viewport so content area has height for centering / scroll -->
<div class="flex min-h-0 w-full flex-1 flex-col">
	<!-- Mobile drawer -->
	<ChallengesDrawer profile={data.profile} />

	<!-- Tab bar -->
	<nav class="flex shrink-0 flex-col px-6">
		<!-- Row 1: Tabs -->
		<div class="flex items-center justify-center py-3">
			<DashboardTabs />
		</div>

		<!-- Row 2: Challenges drawer trigger (mobile only) -->
		{#if dashboard.activeTab === DASHBOARD_TAB.Challenges && dashboard.challenges.length > 1}
			<div class="flex py-3 md:hidden">
				<button
					type="button"
					onclick={() => dashboard.openChallengesDrawer()}
					class="flex items-center gap-1 font-mono text-sm tracking-wider text-(--grey-olive) uppercase transition-colors hover:text-white"
				>
					<Menu size={20} class="text-(--grey-olive)" />
					<span>Challenges</span>
				</button>
			</div>
		{/if}
	</nav>

	<!-- Content area: flex-1 so it fills space; page scrolls when content is long -->
	<div class="flex flex-1 flex-col">
		{#if dashboard.activeTab === DASHBOARD_TAB.ClubLeaderboard}
			<div class="flex min-h-0 flex-1 items-center justify-center">
				<EmptyState title="Club Leaderboard" message="Coming soon." variant="no-challenge" />
			</div>
		{:else}
			<!-- Challenges tab content -->
			{#if dashboard.challenges.length === 0}
				<!-- Zero challenges: empty state -->
				<div class="flex min-h-0 flex-1 items-center justify-center">
					<EmptyState
						title="No Active Challenge"
						message="Check back later for the next event."
						variant="no-challenge"
					/>
				</div>
			{:else if dashboard.challenges.length === 1}
				<!-- Single challenge: centered stage without sidebar -->
				<div class="flex flex-1 flex-col">
					<div class="mx-auto w-full max-w-7xl px-6">
						{#if dashboard.selectedChallenge}
							<ChallengeHero />
							<LeaderboardSection />
						{/if}
					</div>
				</div>
			{:else}
				<!-- Multiple challenges: sidebar (fixed) + stage -->
				<DashboardChallengesSidebar profile={data.profile} />

				<div class="flex flex-1 flex-col">
					<div class="mx-auto w-full max-w-7xl flex-1 px-6 pt-8">
						{#if dashboard.selectedChallenge}
							<ChallengeHero />
							<LeaderboardSection />
						{/if}
					</div>
				</div>
			{/if}
		{/if}

		<DashboardFooter />
	</div>
</div>
