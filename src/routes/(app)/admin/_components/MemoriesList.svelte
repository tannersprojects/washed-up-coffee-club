<script lang="ts">
	import type { MemoryAdmin } from '../_logic/MemoryAdmin.svelte.js';
	import MemoryCard from './MemoryCard.svelte';

	type Props = {
		memories: MemoryAdmin[];
	};

	let { memories }: Props = $props();
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
	{#each memories as memory (memory.id)}
		<MemoryCard {memory} />
	{/each}
</div>
