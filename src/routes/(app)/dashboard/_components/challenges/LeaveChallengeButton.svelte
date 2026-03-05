<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { getFormActionError } from '$lib/utils/form-action.js';
	import type { ChallengeUI } from '../../_logic/ChallengeUI.svelte.js';

	type Props = {
		challenge: ChallengeUI;
	};

	const { challenge }: Props = $props();
</script>

<!-- Leave button: secondary/destructive action -->
<!-- challenge is a ChallengeUI instance from context; mutating its properties is intentional for optimistic UI -->
<form
	method="POST"
	action="?/leaveChallenge"
	use:enhance={() => {
		challenge.isSubmitting = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				// Optimistic update: immediate UI feedback
				challenge.leave();
				// Background sync: ensure server state is reflected
				await update();
			} else {
				challenge.isSubmitting = false;
				const errorMsg = getFormActionError(result) ?? 'Something went wrong. Please try again.';
				toast.error(errorMsg);
			}
		};
	}}
>
	<input type="hidden" name="challengeId" value={challenge.id} />
	<button
		type="submit"
		disabled={challenge.isSubmitting}
		class="cursor-pointer rounded-full border border-gray-600/80 bg-black/60 px-4 py-1.5 font-mono text-[10px] tracking-widest text-gray-300 uppercase transition-colors hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
	>
		{challenge.isSubmitting ? 'Leaving...' : 'Leave Challenge'}
	</button>
</form>
