<script lang="ts">
	import type { AdminTab } from '../_logic/AdminUI.svelte.js';

	type Props = {
		activeTab: AdminTab;
		onTabChange: (tab: AdminTab) => void;
	};

	let { activeTab, onTabChange }: Props = $props();

	const tabs: { id: AdminTab; label: string }[] = [
		{ id: 'memories', label: 'Memories' },
		{ id: 'schedules', label: 'Schedules' },
		{ id: 'challenges', label: 'Challenges' }
	];
</script>

<div class="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
	{#each tabs as tab}
		<button
			type="button"
			class="cursor-pointer rounded-md px-4 py-2 font-mono text-xs font-medium tracking-widest uppercase transition-colors {activeTab ===
			tab.id
				? 'bg-(--accent-lime) text-black'
				: 'text-white/60 hover:bg-white/10 hover:text-white'}"
			onclick={() => onTabChange(tab.id)}
		>
			{tab.label}
		</button>
	{/each}
</div>
