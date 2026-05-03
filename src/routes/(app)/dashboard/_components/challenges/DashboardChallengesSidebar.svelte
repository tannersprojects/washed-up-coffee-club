<script lang="ts">
	import { getDashboardContext } from '../../_logic/context.js';
	import ChallengeListItems from './ChallengeListItems.svelte';
	import type { Profile } from '$lib/db/schema.js';
	import { PanelLeftOpen, PanelRightOpen } from 'lucide-svelte';

	let { profile }: { profile: Profile } = $props();

	const dashboard = getDashboardContext();
	const challenges = $derived(dashboard.challenges);
	const selectedChallengeId = $derived(dashboard.selectedChallengeId);

	let leaveTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleSelect(id: string) {
		dashboard.selectChallenge(id);
	}

	function handleMouseEnter() {
		if (leaveTimeout) {
			clearTimeout(leaveTimeout);
			leaveTimeout = null;
		}
		dashboard.setSidebarHovered(true);
	}

	function handleMouseLeave() {
		leaveTimeout = setTimeout(() => {
			dashboard.setSidebarHovered(false);
			leaveTimeout = null;
		}, 150);
	}

	function handleToggle() {
		dashboard.toggleSidebarPin();
	}
</script>

<!-- Keep w-80 in sync with main column md:pl-80 in +page.svelte -->
<aside
	class="fixed top-24 bottom-0 left-0 z-40 hidden w-80 flex-col border-r border-white/10 bg-[#050505] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:flex"
	style="transform: translateX({dashboard.sidebarExpanded ? '0' : '-100%'});"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<!-- Panel: challenge list content -->
	<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
		<!-- Header -->
		<div
			class="flex shrink-0 flex-row items-center justify-between border-b border-white/10 px-4 py-3"
		>
			<h2 class="font-mono text-[10px] tracking-widest text-(--grey-olive) uppercase">
				Challenges
			</h2>
			<button
				type="button"
				onclick={handleToggle}
				class="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/10"
				aria-label="Toggle sidebar"
			>
				{#if dashboard.sidebarPinned}
					<PanelRightOpen size={20} class="text-(--grey-olive)" />
				{:else}
					<PanelLeftOpen size={20} class="text-(--grey-olive)" />
				{/if}
			</button>
		</div>

		<!-- List of challenges -->
		<div class="min-h-0 flex-1 overflow-y-auto">
			<ChallengeListItems {challenges} {selectedChallengeId} {profile} onSelect={handleSelect} />
		</div>
	</div>
</aside>

<!-- Floating trigger button (only visible when collapsed) -->
{#if !dashboard.sidebarExpanded}
	<button
		type="button"
		onclick={handleToggle}
		onmouseenter={handleMouseEnter}
		class="fixed top-40 left-0 z-50 hidden h-12 w-6 items-center justify-center rounded-r-md border-t border-r border-b border-white/10 bg-[#050505] shadow-lg transition-all hover:w-8 hover:shadow-xl md:flex"
		aria-label="Open sidebar"
	>
		<PanelLeftOpen size={16} class="text-(--grey-olive)" />
	</button>
{/if}
