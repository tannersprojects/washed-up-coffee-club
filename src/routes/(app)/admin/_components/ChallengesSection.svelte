<script lang="ts">
	import { getAdminContext } from '../_logic/context.js';
	import ChallengesList from './ChallengesList.svelte';
	import ChallengeForm from './ChallengeForm.svelte';

	let admin = getAdminContext();
	let challenges = $derived(admin.challenges);
</script>

<section class="flex flex-col gap-6">
	<h2 class="font-mono text-2xl font-bold tracking-widest text-white uppercase">Challenges</h2>
	<ChallengeForm />
	<ChallengesList {challenges} />
</section>
