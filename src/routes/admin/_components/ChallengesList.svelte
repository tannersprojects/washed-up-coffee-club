<script lang="ts">
	import type { ChallengeAdmin } from '../_logic/ChallengeAdmin.svelte.js';
	import ChallengeCard from './ChallengeCard.svelte';

	type Props = {
		challenges: ChallengeAdmin[];
	};

	let { challenges }: Props = $props();
</script>

<div class="flex flex-col gap-3">
	{#each challenges as challenge (challenge.id)}
		<ChallengeCard {challenge} />
	{/each}
</div>
