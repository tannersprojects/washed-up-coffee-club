<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { getFormActionError } from '$lib/utils/form-action.js';
	import type { LandingCopyAdmin } from '../../_logic/LandingCopyAdmin.svelte.js';

	type Props = {
		copy: LandingCopyAdmin;
	};

	let { copy }: Props = $props();
	let isEditing = $state(false);
	let editValue = $state('');

	$effect(() => {
		if (!isEditing) {
			editValue = copy.value;
		}
	});
</script>

{#if isEditing}
	<form
		method="POST"
		action="?/updateLandingCopy"
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') {
					await update();
					isEditing = false;
				} else {
					const errorMsg = getFormActionError(result) ?? 'Failed to update copy.';
					toast.error(errorMsg);
				}
			}}
		class="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
	>
		<input type="hidden" name="key" value={copy.key} />
		<p class="font-mono text-xs font-bold text-(--accent-lime) uppercase">{copy.label}</p>
		<textarea
			name="value"
			bind:value={editValue}
			required
			rows="3"
			maxlength="1000"
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		></textarea>
		<div class="flex gap-2">
			<button
				type="submit"
				class="rounded bg-(--accent-lime) px-3 py-1 font-mono text-xs font-bold text-black uppercase"
				>Save</button
			>
			<button
				type="button"
				onclick={() => (isEditing = false)}
				class="rounded border border-white/20 px-3 py-1 font-mono text-xs text-white/80"
				>Cancel</button
			>
		</div>
	</form>
{:else}
	<div class="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-4">
		<div class="flex items-center justify-between gap-2">
			<p class="font-mono text-xs font-bold text-(--accent-lime) uppercase">{copy.label}</p>
			<button
				onclick={() => (isEditing = true)}
				class="font-mono text-[10px] text-(--accent-lime) hover:underline">Edit</button
			>
		</div>
		<p class="font-mono text-sm leading-relaxed text-white/80">{copy.value}</p>
	</div>
{/if}
