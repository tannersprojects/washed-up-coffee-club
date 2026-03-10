<script lang="ts">
	import { getAdminContext } from '../../_logic/context.js';
	import CopyCard from './CopyCard.svelte';

	let admin = getAdminContext();
	let landingCopy = $derived(admin.landingCopy);
</script>

<section class="flex flex-col gap-6">
	<h2 class="font-mono text-2xl font-bold tracking-widest text-white uppercase">Landing Copy</h2>
	<div class="flex flex-col gap-3">
		{#each landingCopy as copy (copy.key)}
			<CopyCard {copy} />
		{/each}
	</div>
</section>
