<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { getFormActionError } from '$lib/utils/form-action.js';
	import type { MemoryAdmin } from '../../_logic/MemoryAdmin.svelte.js';
	import { getAdminContext } from '../../_logic/context.js';
	import AdminDeleteConfirmDialog from '../AdminDeleteConfirmDialog.svelte';

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

	let showDeleteConfirm = $state(false);
	let isDeleting = $state(false);
	let deleteFormEl: HTMLFormElement | undefined = $state();

	const deleteDialogTitleId = $derived(`memory-delete-title-${memory.id}`);
	const deleteDialogDescId = $derived(`memory-delete-desc-${memory.id}`);

	function openDeleteConfirm() {
		showDeleteConfirm = true;
	}

	function closeDeleteConfirm() {
		if (isDeleting) return;
		showDeleteConfirm = false;
	}

	function submitDelete() {
		if (!deleteFormEl || isDeleting) return;
		isDeleting = true;
		showDeleteConfirm = false;
		deleteFormEl.requestSubmit();
	}
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
					const errorMsg = getFormActionError(result) ?? 'Failed to update memory.';
					toast.error(errorMsg);
				}
			}}
		class="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4 border-l-4"
		style="border-left-color: var(--accent-lime);"
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
		class="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-white/5 border-l-4 {!memory.isActive
			? 'opacity-60'
			: ''}"
		style="border-left-color: var(--accent-lime);"
	>
		<img src={memory.src} alt={memory.caption} class="aspect-square w-full object-cover" />
		<div class="flex flex-col gap-2 p-4">
			<p class="line-clamp-2 font-mono text-sm font-bold text-white">{memory.caption}</p>
			<p class="font-mono text-xs text-white/60">
				Order: {memory.sortOrder} · {memory.isActive ? 'Active' : 'Inactive'}
			</p>
			<div class="flex shrink-0 items-center gap-2">
				<button
					type="button"
					onclick={() => (isEditing = true)}
					class="font-mono text-[10px] text-(--accent-lime) hover:underline"
				>
					Edit
				</button>
				<form
					bind:this={deleteFormEl}
					method="POST"
					action="?/deleteMemory"
					use:enhance={() => {
						const id = memory.id;
						admin.removeMemoryOptimistic(id);
						return async ({ result, update }) => {
							isDeleting = false;
							if (result.type === 'success') {
								await update();
							} else {
								const errorMsg = getFormActionError(result) ?? 'Failed to delete.';
								toast.error(errorMsg);
								await update();
							}
						};
					}}
					class="inline-flex"
				>
					<input type="hidden" name="id" value={memory.id} />
					<button
						type="button"
						onclick={openDeleteConfirm}
						class="font-mono text-[10px] text-red-400 hover:underline"
					>
						Delete
					</button>
				</form>
			</div>
		</div>
	</div>

	<AdminDeleteConfirmDialog
		open={showDeleteConfirm}
		title="Delete memory?"
		titleId={deleteDialogTitleId}
		descriptionId={deleteDialogDescId}
		busy={isDeleting}
		onclose={closeDeleteConfirm}
		onconfirm={submitDelete}
	>
		This will permanently remove this image and
		<span class="font-bold text-white">{memory.caption}</span>. This cannot be undone.
	</AdminDeleteConfirmDialog>
{/if}
