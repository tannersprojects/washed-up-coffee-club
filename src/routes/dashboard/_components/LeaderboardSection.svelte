<script lang="ts">
	import { getDashboardContext } from '../_logic/context.js';
	import LeaderboardTabs from './LeaderboardTabs.svelte';
	import LeaderboardTable from './LeaderboardTable.svelte';
	import ChallengeDetails from './ChallengeDetails.svelte';

	const dashboard = getDashboardContext();
	const challenge = $derived(dashboard.selectedChallenge);
	const activeTab = $derived(challenge?.activeTab);

	// Reveal Animation Action
	function reveal(node: HTMLElement) {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						node.classList.add('reveal-active');
						observer.unobserve(node);
					}
				});
			},
			{ threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
		);
		observer.observe(node);
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<section use:reveal class="reveal mx-auto max-w-5xl px-6">
	<LeaderboardTabs />

	{#if activeTab === 'leaderboard'}
		<LeaderboardTable />
	{:else if activeTab === 'details'}
		<ChallengeDetails />
	{/if}
</section>
