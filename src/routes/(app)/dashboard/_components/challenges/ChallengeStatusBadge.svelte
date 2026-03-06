<script lang="ts">
	import { CHALLENGE_STATUS_BADGE_CONFIG, type ChallengeStatusBadge } from '$lib/constants';

	let { badge }: { badge: ChallengeStatusBadge } = $props();

	const config = $derived(CHALLENGE_STATUS_BADGE_CONFIG[badge]);
</script>

<span
	class="inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] tracking-widest uppercase {config.classes}"
>
	{config.label}
</span>
