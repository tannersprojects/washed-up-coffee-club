<script lang="ts">
	import { getAdminContext } from '../_logic/context.js';
	import MemoriesList from './MemoriesList.svelte';
	import MemoryForm from './MemoryForm.svelte';

	let admin = getAdminContext();
	let memories = $derived(admin.memories);
</script>

<section class="flex flex-col gap-6">
	<h2 class="font-mono text-2xl font-bold tracking-widest text-white uppercase">Memories</h2>
	<MemoryForm />
	<MemoriesList {memories} />
</section>
