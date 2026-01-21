<script lang="ts">
	import { formatDate } from '$lib/utils/date-utils.js';
	import { formatTimeRemaining } from '$lib/utils/timer-utils.js';
	import { calculateTotalDistanceKm } from '$lib/utils/challenge-utils.js';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	// --- 1. DATA FROM SERVER ---
	let { data } = $props();

	// Use derived state so if data refreshes, UI updates automatically
	let challenge = $derived(data.challenge);
	let leaderboard = $derived(data.leaderboard || []);
	let profile = $derived(data.profile);

	// --- 2. STATE & LOGIC ---
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

	// Calculate Total KM for the community based on the challenge goal
	let totalDistanceKm = $derived(
		calculateTotalDistanceKm(leaderboard, challenge?.goalValue ?? null)
	);

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

	// Helper Snippets
	const getStatusColor = (status: string | null) => {
		switch (status) {
			case 'completed':
				return 'text-(--accent-lime)';
			case 'in_progress':
				return 'text-blue-400 animate-pulse';
			case 'dnf':
				return 'text-red-500 line-through opacity-50';
			default:
				return 'text-gray-500';
		}
	};
</script>

<!-- GLOBAL WRAPPER -->
<div
	class="min-h-screen w-full bg-[#050505] font-sans text-white selection:bg-(--accent-lime) selection:text-black"
>
	<!-- NAVIGATION -->
	<nav
		class="fixed top-0 z-40 flex w-full items-center justify-between border-b border-white/10 bg-[#050505]/80 px-6 py-4 backdrop-blur-md"
	>
		<div class="flex items-center gap-2">
			<a href="/" class="group flex items-center gap-2">
				<div
					class="h-3 w-3 rounded-full bg-(--accent-lime) transition-transform group-hover:scale-110"
				></div>
				<span class="text-sm font-bold tracking-tight text-white uppercase">Washed Up CC</span>
			</a>
			<span class="mx-2 text-white/20">/</span>
			<span class="font-mono text-xs tracking-widest text-white/60 uppercase">Dashboard</span>
		</div>
		<div class="flex items-center gap-4">
			<div
				class="hidden items-center gap-2 font-mono text-[10px] tracking-widest text-(--accent-lime) uppercase md:flex"
			>
				<span class="relative flex h-2 w-2">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--accent-lime) opacity-75"
					></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-(--accent-lime)"></span>
				</span>
				Live Feed
			</div>
			<div class="h-8 w-8 overflow-hidden rounded-full border border-white/20 bg-gray-800">
				<!-- Logged In User Avatar -->
				{#if profile}
					<img
						src={`https://ui-avatars.com/api/?name=${profile.firstname}+${profile.lastname}&background=random&color=fff`}
						alt="User"
						class="h-full w-full object-cover"
					/>
				{/if}
			</div>
		</div>
	</nav>

	<main class="relative pt-24 pb-20">
		{#if challenge}
			<!-- 1. CHALLENGE HERO -->
			<header class="mx-auto mb-16 max-w-5xl px-6">
				<div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<div class="space-y-2">
						<div class="flex items-center gap-3">
							<span
								class="rounded-full border border-(--accent-lime)/30 bg-(--accent-lime)/10 px-3 py-1 text-[10px] font-bold tracking-widest text-(--accent-lime) uppercase"
							>
								Active Challenge
							</span>
							<span class="font-mono text-[10px] tracking-widest text-gray-500 uppercase">
								{formatDate(challenge.startDate)}
							</span>
						</div>
						<h1
							class="text-5xl font-black tracking-tighter text-white uppercase italic md:text-8xl"
						>
							{challenge.title}
						</h1>
					</div>

					<div class="flex flex-col items-end">
						<span class="mb-1 font-mono text-[10px] tracking-widest text-gray-500 uppercase"
							>Time Remaining</span
						>
						<div
							class="font-mono text-4xl font-bold tracking-widest text-white tabular-nums md:text-5xl"
						>
							{timeLeft}
						</div>
					</div>
				</div>

				<!-- Stats Grid -->
				<div
					class="mt-12 grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-4"
				>
					{#each [{ label: 'Runners', value: totalRunners }, { label: 'Finished', value: finishers }, { label: 'On Course', value: activeRunners }, { label: 'Total KM', value: totalDistanceKm }] as stat}
						<div
							class="group flex flex-col items-center justify-center bg-[#050505] p-6 transition-colors hover:bg-white/5"
						>
							<span class="mb-2 font-mono text-[10px] tracking-widest text-gray-500 uppercase"
								>{stat.label}</span
							>
							<span
								class="text-2xl font-bold text-white transition-colors group-hover:text-(--accent-lime)"
								>{stat.value}</span
							>
						</div>
					{/each}
				</div>
			</header>

			<!-- 2. LEADERBOARD SECTION -->
			<section class="mx-auto max-w-5xl px-6">
				<!-- Tabs -->
				<div class="mb-8 flex border-b border-white/10">
					<button
						class="border-b-2 px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors {activeTab ===
						'leaderboard'
							? 'border-(--accent-lime) text-white'
							: 'border-transparent text-gray-500 hover:text-white'}"
						onclick={() => (activeTab = 'leaderboard')}
					>
						Leaderboard
					</button>
					<button
						class="border-b-2 px-6 py-3 text-sm font-bold tracking-wider uppercase transition-colors {activeTab ===
						'details'
							? 'border-(--accent-lime) text-white'
							: 'border-transparent text-gray-500 hover:text-white'}"
						onclick={() => (activeTab = 'details')}
					>
						Details
					</button>
				</div>

				<!-- List Header -->
				<div
					class="grid grid-cols-[30px_1fr_1fr_auto] gap-4 border-b border-white/20 px-4 py-3 font-mono text-[10px] tracking-widest text-gray-500 uppercase md:grid-cols-[50px_2fr_1fr_1fr_1fr_1fr]"
				>
					<div class="text-center">#</div>
					<div>Athlete</div>
					<div class="hidden md:block">Activity</div>
					<div class="text-right">Distance</div>
					<div class="text-right">Pace</div>
					<div class="text-right">Time/Status</div>
				</div>

				<!-- List Rows -->
				<div class="flex flex-col">
					{#each leaderboard as row, i}
						<div
							class="group grid grid-cols-[30px_1fr_1fr_auto] items-center gap-4 border-b border-white/5 px-4 py-6 transition-colors hover:bg-white/5 md:grid-cols-[50px_2fr_1fr_1fr_1fr_1fr]"
							in:fly={{ y: 20, delay: i * 50 }}
						>
							<!-- Rank -->
							<div
								class="text-center font-mono text-lg font-bold {row.rank === 1
									? 'text-(--accent-lime)'
									: 'text-gray-600'}"
							>
								{row.rank || '-'}
							</div>

							<!-- Athlete Info -->
							<div class="flex items-center gap-4">
								<div
									class="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-gray-800"
								>
									<img
										src={`https://ui-avatars.com/api/?name=${row.profile.firstname}+${row.profile.lastname}&background=random&color=fff`}
										alt={row.profile.firstname}
										class="h-full w-full object-cover"
									/>
									{#if row.participant.status === 'in_progress'}
										<div
											class="absolute right-0 bottom-0 h-2.5 w-2.5 animate-pulse rounded-full border border-black bg-blue-500"
										></div>
									{/if}
								</div>
								<div class="flex flex-col">
									<span
										class="max-w-[120px] truncate text-base font-bold tracking-tight text-white transition-colors group-hover:text-(--accent-lime) md:max-w-none"
									>
										{row.profile.firstname}
										{row.profile.lastname}
									</span>
									<!-- Mobile Only: Result Display -->
									<span class="font-mono text-[10px] text-gray-500 uppercase md:hidden"
										>{row.participant.resultDisplay || '--'}</span
									>
								</div>
							</div>

							<!-- Activity Name (Desktop) -->
							<div class="hidden flex-col justify-center md:flex">
								<span class="truncate font-mono text-xs text-white/80 uppercase">
									{row.contribution?.activityName || 'No Data'}
								</span>
								{#if row.contribution}
									<span class="text-[10px] text-gray-600"
										>{formatDate(row.contribution.occurredAt)}</span
									>
								{/if}
							</div>

							<!-- Distance -->
							<div class="flex flex-col items-end justify-center">
								<span class="font-mono font-bold text-white">
									{#if challenge.goalValue}
										{(challenge.goalValue / 1000).toFixed(1)}
										<span class="text-[10px] text-gray-500">KM</span>
									{:else}
										--
									{/if}
								</span>
								<!-- Simple Progress Bar -->
								<div class="mt-2 h-1 w-full max-w-[80px] overflow-hidden rounded-full bg-gray-800">
									<div
										class="h-full bg-(--accent-lime) transition-all duration-1000"
										style="width: {row.participant.status === 'completed' ? '100%' : '0%'}"
									></div>
								</div>
							</div>

							<!-- Pace (Placeholder / Calc) -->
							<div class="hidden flex-col items-end justify-center md:flex">
								<span class="font-mono text-sm text-gray-300">-- /km</span>
							</div>

							<!-- Time/Status -->
							<div class="flex flex-col items-end justify-center text-right">
								{#if row.participant.status === 'completed'}
									<span class="font-mono text-xl font-bold text-white"
										>{row.participant.resultDisplay}</span
									>
									<span class="font-mono text-[10px] tracking-wider text-(--accent-lime) uppercase"
										>Official</span
									>
								{:else}
									<span
										class="font-mono text-sm font-bold uppercase {getStatusColor(
											row.participant.status
										)}">{row.participant.status}</span
									>
									<span class="font-mono text-[10px] tracking-wider text-gray-500 uppercase">
										{row.participant.resultDisplay || '--'}
									</span>
								{/if}
							</div>
						</div>
					{/each}

					<!-- Empty State if no runners -->
					{#if leaderboard.length === 0}
						<div class="border-b border-white/5 py-20 text-center">
							<p class="font-mono text-xs tracking-widest text-gray-500 uppercase">
								No participants yet.
							</p>
							<p class="mt-2 text-white">Be the first to toe the line.</p>
						</div>
					{/if}
				</div>
			</section>
		{:else}
			<!-- No Active Challenge State -->
			<div class="flex h-[50vh] w-full items-center justify-center">
				<div class="text-center">
					<h2 class="text-2xl font-black text-gray-600 uppercase italic">No Active Challenge</h2>
					<p class="mt-2 font-mono text-xs tracking-widest text-gray-500 uppercase">
						Check back later for the next event.
					</p>
				</div>
			</div>
		{/if}
	</main>
</div>
