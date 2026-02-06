<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import type { MemoryAdmin } from '../_logic/MemoryAdmin.svelte.js';
	import { getAdminContext } from '../_logic/context.js';

	type Props = {
		memory: MemoryAdmin;
	};

	let { memory }: Props = $props();
	let admin = getAdminContext();

	let isEditing = $state(false);
	let editCaption = $derived(memory.caption);
	let editSortOrder = $derived(memory.sortOrder);
	let editIsActive = $derived(memory.isActive);

	$effect(() => {
		if (!isEditing) {
			editCaption = memory.caption;
			editSortOrder = memory.sortOrder;
			editIsActive = memory.isActive;
		}
	});
</script>

{#if isEditing}
	<form
		method="POST"
		action="?/updateMemory"
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') {
					await update();
					isEditing = false;
				} else {
					const message =
						(result.type === 'failure' ? (result.data as { error?: string })?.error : undefined) ??
						'Failed to update memory.';
					toast.error(message);
				}
			}}
		class="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
	>
		<input type="hidden" name="id" value={memory.id} />
		<input
			type="text"
			name="caption"
			bind:value={editCaption}
			required
			maxlength="500"
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		/>
		<input
			type="number"
			name="sortOrder"
			bind:value={editSortOrder}
			min="0"
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white"
		/>
		<label class="flex cursor-pointer items-center gap-2 font-mono text-xs text-white/80">
			<input type="hidden" name="isActive" value={editIsActive ? 'true' : 'false'} />
			<input type="checkbox" bind:checked={editIsActive} />
			Active
		</label>
		<div class="mt-auto flex gap-2">
			<button
				type="submit"
				class="rounded bg-(--accent-lime) px-3 py-1 font-mono text-xs font-bold text-black uppercase"
			>
				Save
			</button>
			<button
				type="button"
				onclick={() => (isEditing = false)}
				class="rounded border border-white/20 px-3 py-1 font-mono text-xs text-white/80"
			>
				Cancel
			</button>
		</div>
	</form>
{:else}
	<div
		class="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-white/5 {!memory.isActive
			? 'opacity-60'
			: ''}"
	>
		<img src={memory.src} alt={memory.caption} class="aspect-square w-full object-cover" />
		<div class="flex flex-col gap-2 p-3">
			<p class="line-clamp-2 font-mono text-xs text-white/80">{memory.caption}</p>
			<p class="font-mono text-[10px] text-white/40">Order: {memory.sortOrder}</p>
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => (isEditing = true)}
					class="font-mono text-[10px] text-(--accent-lime) hover:underline"
				>
					Edit
				</button>
				<form
					method="POST"
					action="?/deleteMemory"
					use:enhance={() => {
						const id = memory.id;
						admin.removeMemoryOptimistic(id);
						return async ({ result, update }) => {
							if (result.type === 'success') {
								await update();
							} else {
								const msg =
									(result.type === 'failure'
										? (result.data as { error?: string })?.error
										: undefined) ?? 'Failed to delete.';
								toast.error(msg);
								await update();
							}
						};
					}}
					class="inline-flex"
				>
					<input type="hidden" name="id" value={memory.id} />
					<button type="submit" class=" font-mono text-[10px] text-red-400 hover:underline">
						Delete
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
