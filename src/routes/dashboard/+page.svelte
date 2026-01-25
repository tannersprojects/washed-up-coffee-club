<script lang="ts">
	import { formatTimeRemaining } from '$lib/utils/timer-utils.js';
	import { calculateTotalDistanceKm } from '$lib/utils/challenge-utils.js';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { ChallengeStats, ChallengeWithParticipation } from '$lib/types/dashboard.js';
	import DashboardNav from './components/DashboardNav.svelte';
	import ChallengeHero from './components/ChallengeHero.svelte';
	import LeaderboardSection from './components/LeaderboardSection.svelte';
	import EmptyState from './components/EmptyState.svelte';

	// --- DATA FROM SERVER ---
	let { data } = $props();

	// Use derived state so if data refreshes, UI updates automatically
	let challenge = $derived(data.challenge) as ChallengeWithParticipation | null;
	let leaderboard = $derived(data.leaderboard || []);
	let profile = $derived(data.profile);

	// Form submission state
	let isSubmitting = $state(false);

	// --- STATE & LOGIC ---
	let timeLeft = $state('00:00:00');
	let activeTab = $state<'leaderboard' | 'details'>('leaderboard');

	// Stats Calculations
	let totalRunners = $derived(leaderboard.length);
	let finishers = $derived(
		leaderboard.filter((row) => row.participant.status === 'completed').length
	);
	let activeRunners = $derived(
		leaderboard.filter((row) => row.participant.status === 'in_progress').length
	);

	let totalDistanceKm = $derived(
		calculateTotalDistanceKm(leaderboard, challenge?.goalValue ?? null)
	);

	// Compose stats object
	let stats = $derived<ChallengeStats>({
		totalRunners,
		finishers,
		activeRunners,
		totalDistanceKm
	});

	// Tab change handler
	const handleTabChange = (tab: 'leaderboard' | 'details') => {
		activeTab = tab;
	};

	// Form submission handler
	const handleJoinChallenge = () => {
		// Run immediately before submission
		isSubmitting = true;

		return async ({
			result,
			update
		}: {
			result: { type: 'success' | 'failure' | 'redirect' | 'error' };
			update: (options?: { reset?: boolean }) => Promise<void>;
		}) => {
			// Wait for the server response
			await update();

			// Run after the form action completes
			isSubmitting = false;

			if (result.type === 'success') {
				// Invalidate all data to refresh the page
				await invalidateAll();
			}
		};
	};

	// Countdown Logic
	onMount(() => {
		if (!challenge?.endDate) return;

		const interval = setInterval(() => {
			const formatted = formatTimeRemaining(challenge.endDate);
			timeLeft = formatted;

			// Stop the interval if time has expired
			if (formatted === '00:00:00') {
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<!-- GLOBAL WRAPPER -->
<div
	class="min-h-screen w-full bg-[#050505] font-sans text-white selection:bg-(--accent-lime) selection:text-black"
>
	<DashboardNav {profile} />

	<main class="relative pt-24 pb-20">
		{#if challenge}
			<form method="POST" action="?/joinChallenge" use:enhance={handleJoinChallenge}>
				<input type="hidden" name="challengeId" value={challenge.id} />
				<ChallengeHero {challenge} {timeLeft} {stats} {isSubmitting} />
			</form>
			<LeaderboardSection {leaderboard} {challenge} {activeTab} onTabChange={handleTabChange} />
		{:else}
			<EmptyState
				title="No Active Challenge"
				message="Check back later for the next event."
				variant="no-challenge"
			/>
		{/if}
	</main>
</div>
