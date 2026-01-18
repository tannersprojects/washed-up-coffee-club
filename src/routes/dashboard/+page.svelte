<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { StravaSummaryAthlete } from '$lib/types/strava'; // Assuming you put your types in a file, or I define them below

	// --- 1. TYPES & INTERFACES (Mocking your backend) ---

	type ChallengeStatus = 'active' | 'completed' | 'upcoming';
	type RunnerStatus = 'finished' | 'running' | 'dnf' | 'registered';

	interface Challenge {
		id: string;
		title: string;
		type: string;
		date: string;
		deadline: string; // ISO String
		distance: number; // meters
		status: ChallengeStatus;
	}

	interface LeaderboardEntry {
		athlete: Partial<StravaSummaryAthlete>;
		rank: number | null;
		status: RunnerStatus;
		finishTime: string | null; // "1:45:30"
		pace: string | null; // "8:03 /mi"
		distanceCovered: number; // meters
		lastUpdate: string; // "Just now"
	}

	// --- 2. MOCK DATA GENERATOR ---

	const MOCK_CHALLENGE: Challenge = {
		id: 'c_01',
		title: 'The "Sunday Scaries" Half',
		type: 'Flash Challenge',
		date: 'Jan 18, 2026',
		deadline: '2026-01-18T23:59:59',
		distance: 21097.5, // Half Marathon in meters
		status: 'active'
	};

	const MOCK_RUNNERS: LeaderboardEntry[] = [
		{
			athlete: {
				id: 1,
				firstname: 'Sarah',
				lastname: 'Jenkins',
				city: 'Charleston',
				state: 'SC',
				profile: 'https://i.pravatar.cc/150?u=1'
			},
			rank: 1,
			status: 'finished',
			finishTime: '1:28:45',
			pace: '6:46 /mi',
			distanceCovered: 21097.5,
			lastUpdate: 'Finished'
		},
		{
			athlete: {
				id: 2,
				firstname: 'Marcus',
				lastname: 'Dill',
				city: 'Mt Pleasant',
				state: 'SC',
				profile: 'https://i.pravatar.cc/150?u=2'
			},
			rank: 2,
			status: 'finished',
			finishTime: '1:32:10',
			pace: '7:02 /mi',
			distanceCovered: 21097.5,
			lastUpdate: 'Finished'
		},
		{
			athlete: {
				id: 3,
				firstname: 'Emily',
				lastname: 'Voss',
				city: 'Charleston',
				state: 'SC',
				profile: 'https://i.pravatar.cc/150?u=3'
			},
			rank: 3,
			status: 'finished',
			finishTime: '1:45:30',
			pace: '8:03 /mi',
			distanceCovered: 21097.5,
			lastUpdate: 'Finished'
		},
		{
			athlete: {
				id: 4,
				firstname: 'Tyler',
				lastname: 'Durden',
				city: 'North Charleston',
				state: 'SC',
				profile: 'https://i.pravatar.cc/150?u=4'
			},
			rank: null,
			status: 'running',
			finishTime: null,
			pace: '7:45 /mi',
			distanceCovered: 15000,
			lastUpdate: 'Mile 9'
		},
		{
			athlete: {
				id: 5,
				firstname: 'Jessica',
				lastname: 'Alba',
				city: 'Charleston',
				state: 'SC',
				profile: 'https://i.pravatar.cc/150?u=5'
			},
			rank: null,
			status: 'running',
			finishTime: null,
			pace: '9:12 /mi',
			distanceCovered: 5200,
			lastUpdate: 'Mile 3'
		},
		{
			athlete: {
				id: 6,
				firstname: 'Ken',
				lastname: 'Block',
				city: 'Kiawah',
				state: 'SC',
				profile: 'https://i.pravatar.cc/150?u=6'
			},
			rank: null,
			status: 'dnf',
			finishTime: null,
			pace: '--',
			distanceCovered: 8000,
			lastUpdate: 'Stopped'
		}
	];

	// --- 3. STATE & LOGIC ---

	let timeLeft = $state('00:00:00');
	let activeTab = $state<'leaderboard' | 'details'>('leaderboard');

	// Stats
	let totalRunners = MOCK_RUNNERS.length;
	let finishers = MOCK_RUNNERS.filter((r) => r.status === 'finished').length;
	let activeRunners = MOCK_RUNNERS.filter((r) => r.status === 'running').length;

	// Countdown Logic
	onMount(() => {
		const interval = setInterval(() => {
			const now = new Date();
			// Mocking 4 hours left just for visuals
			const end = new Date(now.getTime() + 4 * 60 * 60 * 1000 + 15 * 60 * 1000);
			const diff = end.getTime() - now.getTime();

			const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const s = Math.floor((diff % (1000 * 60)) / 1000);

			timeLeft = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
		}, 1000);

		return () => clearInterval(interval);
	});

	// Helper Snippets
	const getStatusColor = (status: RunnerStatus) => {
		switch (status) {
			case 'finished':
				return 'text-(--accent-lime)';
			case 'running':
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
	<!-- NOISE OVERLAY -->
	<div
		class="pointer-events-none fixed inset-0 z-50 opacity-[0.06] mix-blend-overlay"
		style="background-image: url('https://grainy-gradients.vercel.app/noise.svg');"
	></div>

	<!-- NAVIGATION (Simplified for Dashboard) -->
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
				<!-- Mock User Profile -->
				<img src="https://i.pravatar.cc/150?u=99" alt="User" class="h-full w-full object-cover" />
			</div>
		</div>
	</nav>

	<main class="relative pt-24 pb-20">
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
							{MOCK_CHALLENGE.date}
						</span>
					</div>
					<h1 class="text-5xl font-black tracking-tighter text-white uppercase italic md:text-8xl">
						{MOCK_CHALLENGE.title}
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
			<div class="mt-12 grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-4">
				{#each [{ label: 'Runners', value: totalRunners }, { label: 'Finished', value: finishers }, { label: 'On Course', value: activeRunners }, { label: 'Distance', value: '21.1km' }] as stat}
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
				<div class="hidden md:block">Location</div>
				<div class="text-right">Distance</div>
				<div class="text-right">Pace</div>
				<div class="text-right">Time/Status</div>
			</div>

			<!-- List Rows -->
			<div class="flex flex-col">
				{#each MOCK_RUNNERS as runner, i}
					<div
						class="group grid grid-cols-[30px_1fr_1fr_auto] items-center gap-4 border-b border-white/5 px-4 py-6 transition-colors hover:bg-white/5 md:grid-cols-[50px_2fr_1fr_1fr_1fr_1fr]"
						in:fly={{ y: 20, delay: i * 50 }}
					>
						<!-- Rank -->
						<div
							class="text-center font-mono text-lg font-bold {runner.rank === 1
								? 'text-(--accent-lime)'
								: 'text-gray-600'}"
						>
							{runner.rank || '-'}
						</div>

						<!-- Athlete Info -->
						<div class="flex items-center gap-4">
							<div
								class="relative h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-gray-800"
							>
								<img
									src={runner.athlete.profile}
									alt={runner.athlete.firstname}
									class="h-full w-full object-cover"
								/>
								{#if runner.status === 'running'}
									<div
										class="absolute right-0 bottom-0 h-2.5 w-2.5 animate-pulse rounded-full border border-black bg-blue-500"
									></div>
								{/if}
							</div>
							<div class="flex flex-col">
								<span
									class="text-base font-bold tracking-tight text-white transition-colors group-hover:text-(--accent-lime)"
								>
									{runner.athlete.firstname}
									{runner.athlete.lastname}
								</span>
								<span class="font-mono text-[10px] text-gray-500 uppercase md:hidden"
									>{runner.lastUpdate}</span
								>
							</div>
						</div>

						<!-- Location (Desktop) -->
						<div class="hidden items-center font-mono text-xs text-gray-400 uppercase md:flex">
							{runner.athlete.city}, {runner.athlete.state}
						</div>

						<!-- Distance -->
						<div class="flex flex-col items-end justify-center">
							<span class="font-mono font-bold text-white"
								>{(runner.distanceCovered / 1000).toFixed(1)}
								<span class="text-[10px] text-gray-500">KM</span></span
							>
							<div class="mt-2 h-1 w-full max-w-[80px] overflow-hidden rounded-full bg-gray-800">
								<div
									class="h-full bg-(--accent-lime)"
									style="width: {(runner.distanceCovered / MOCK_CHALLENGE.distance) * 100}%"
								></div>
							</div>
						</div>

						<!-- Pace -->
						<div class="hidden flex-col items-end justify-center md:flex">
							<span class="font-mono text-sm text-gray-300">{runner.pace}</span>
						</div>

						<!-- Time/Status -->
						<div class="flex flex-col items-end justify-center text-right">
							{#if runner.status === 'finished'}
								<span class="font-mono text-xl font-bold text-white">{runner.finishTime}</span>
								<span class="font-mono text-[10px] tracking-wider text-(--accent-lime) uppercase"
									>Official</span
								>
							{:else}
								<span class="font-mono text-sm font-bold uppercase {getStatusColor(runner.status)}"
									>{runner.status}</span
								>
								<span class="font-mono text-[10px] tracking-wider text-gray-500 uppercase"
									>{runner.lastUpdate}</span
								>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>
	</main>
</div>
