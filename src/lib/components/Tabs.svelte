<script lang="ts">
	type Tab = { value: string; label: string };

	let {
		tabs,
		value,
		onSelect,
		class: className = ''
	}: {
		tabs: Tab[];
		value: string;
		onSelect: (value: string) => void;
		class?: string;
	} = $props();
</script>

<div
	class="flex flex-row justify-between gap-1 overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-1 {className}"
>
	{#each tabs as tab}
		<button
			type="button"
			class="flex shrink-0 cursor-pointer justify-center rounded-md px-4 py-2 text-sm font-bold tracking-wider uppercase transition-colors {value ===
			tab.value
				? 'bg-(--accent-lime) text-black'
				: 'text-white/60 hover:bg-white/10 hover:text-white'}"
			onclick={() => onSelect(tab.value)}
		>
			{tab.label}
		</button>
	{/each}
</div>
