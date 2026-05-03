<script lang="ts">
	import { untrack } from 'svelte';
	import { DASHBOARD_TAB } from '$lib/constants';

	import EmptyState from '$lib/components/EmptyState.svelte';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import { APP_FOOTER_VARIANT, EMPTY_STATE_VARIANT } from '$lib/constants';
	import {
		ChallengesDrawer,
		DashboardChallengesSidebar,
		ChallengeHero,
		LeaderboardSection,
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

	// Stop countdown timers when navigating away
	$effect(() => {
		return () => dashboard.cleanup();
	});

	let drawerTriggerRef = $state<HTMLButtonElement | undefined>(undefined);
</script>

{#snippet challengeStage()}
	{#if dashboard.selectedChallenge}
		<ChallengeHero />
		<LeaderboardSection />
	{/if}
{/snippet}

<!-- Outer wrapper: fill viewport so content area has height for centering / scroll -->
<div class="flex min-h-0 w-full flex-1 flex-col">
	<!-- Mobile drawer -->
	<ChallengesDrawer profile={data.profile} onClose={() => drawerTriggerRef?.focus()} />

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
					bind:this={drawerTriggerRef}
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
				<EmptyState
					title="Club Leaderboard"
					message="Coming soon."
					variant={EMPTY_STATE_VARIANT.FULL_PAGE}
				/>
			</div>
		{:else}
			<!-- Challenges tab content -->
			{#if dashboard.challenges.length === 0}
				<!-- Zero challenges: empty state -->
				<div class="flex min-h-0 flex-1 items-center justify-center">
					<EmptyState
						title="No Active Challenge"
						message="Check back later for the next event."
						variant={EMPTY_STATE_VARIANT.FULL_PAGE}
					/>
				</div>
			{:else if dashboard.challenges.length === 1}
				<!-- Single challenge: centered stage without sidebar -->
				<div class="flex flex-1 flex-col">
					<div class="mx-auto w-full max-w-7xl px-6">
						{@render challengeStage()}
					</div>
				</div>
			{:else}
				<!-- Multiple challenges: sidebar (fixed) + stage -->
				<DashboardChallengesSidebar profile={data.profile} />

				<!-- md:pl-80 must match sidebar w-80 (DashboardChallengesSidebar) -->
				<div
					class="flex flex-1 flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
					class:md:pl-80={dashboard.sidebarExpanded}
				>
					<div class="mx-auto w-full max-w-7xl flex-1 px-6 pt-8">
						{@render challengeStage()}
					</div>
				</div>
			{/if}
		{/if}

		<AppFooter variant={APP_FOOTER_VARIANT.STRAVA} />
	</div>
</div>
