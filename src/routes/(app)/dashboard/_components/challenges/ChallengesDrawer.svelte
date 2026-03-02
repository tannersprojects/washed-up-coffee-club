<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import { getDashboardContext } from '../../_logic/context.js';
	import ChallengeListItems from './ChallengeListItems.svelte';
	import type { Profile } from '$lib/db/schema.js';

	let { profile, onClose }: { profile: Profile; onClose?: () => void } = $props();

	const dashboard = getDashboardContext();
	const isOpen = $derived(dashboard.drawerOpen);
	const challenges = $derived(dashboard.challenges);
	const selectedChallengeId = $derived(dashboard.selectedChallengeId);

	function handleSelect(id: string) {
		dashboard.selectChallenge(id);
		dashboard.closeChallengesDrawer();
	}

	function handleClose() {
		dashboard.closeChallengesDrawer();
		onClose?.();
	}

	let drawerRef = $state<HTMLDivElement | undefined>(undefined);

	$effect(() => {
		if (!isOpen) return;
		const id = setTimeout(() => {
			drawerRef?.querySelector<HTMLButtonElement>('button')?.focus();
		}, 0);
		return () => clearTimeout(id);
	});
</script>

{#if isOpen}
	<!-- Overlay -->
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-50 bg-black/60"
		onclick={handleClose}
		onkeydown={(e) => e.key === 'Escape' && handleClose()}
		role="presentation"
	></div>

	<!-- Drawer panel -->
	<div
		bind:this={drawerRef}
		transition:fly={{ x: -320, duration: 250, easing: cubicOut }}
		class="fixed left-0 top-0 bottom-0 z-50 flex w-[80%] max-w-sm flex-col border-r border-white/10 bg-[#050505] shadow-2xl"
		role="dialog"
		aria-modal="true"
		aria-labelledby="drawer-challenges-title"
	>
		<!-- Header -->
		<div class="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4">
			<h2 id="drawer-challenges-title" class="font-mono text-sm tracking-widest text-white uppercase"
				>Challenges</h2
			>
			<button
				type="button"
				onclick={handleClose}
				class="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/10"
				aria-label="Close drawer"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="h-5 w-5 text-(--grey-olive)"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Challenge list -->
		<div class="min-h-0 flex-1 overflow-y-auto">
			<ChallengeListItems
				{challenges}
				{selectedChallengeId}
				{profile}
				onSelect={handleSelect}
			/>
		</div>
	</div>
{/if}
