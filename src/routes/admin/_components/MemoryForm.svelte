<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { getAdminContext } from '../_logic/context.js';
	import { MemoryAdmin } from '../_logic/MemoryAdmin.svelte.js';

	let admin = getAdminContext();
	let caption = $state('');
	let file: File | null = $state(null);
	let filePreview = $state<string | null>(null);
	let isSubmitting = $state(false);

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const f = input.files?.[0];
		if (f) {
			file = f;
			filePreview = URL.createObjectURL(f);
		} else {
			file = null;
			if (filePreview) URL.revokeObjectURL(filePreview);
			filePreview = null;
		}
	}

	function resetForm() {
		caption = '';
		file = null;
		if (filePreview) URL.revokeObjectURL(filePreview);
		filePreview = null;
		isSubmitting = false;
	}
</script>

<form
	method="POST"
	action="?/createMemory"
	enctype="multipart/form-data"
	use:enhance={({ formData }) => {
		if (!file || !caption.trim()) return () => {};
		const id = crypto.randomUUID();
		formData.set('id', id);

		console.log(`Sort Order: ${admin.memories.length}`);

		const optimistic = new MemoryAdmin({
			id,
			src: filePreview ?? '',
			caption: caption.trim(),
			sortOrder: admin.memories.length,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		admin.addMemoryOptimistic(optimistic);
		isSubmitting = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				await update();
				resetForm();
			} else {
				admin.removeMemoryOptimistic(id);
				const message =
					(result.type === 'failure' ? (result.data as { error?: string })?.error : undefined) ??
					'Failed to create memory.';
				toast.error(message);
			}
			isSubmitting = false;
		};
	}}
	class="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
>
	<div class="flex flex-col gap-2">
		<label for="memory-caption" class="font-mono text-xs font-medium text-white/80">Caption</label>
		<input
			id="memory-caption"
			type="text"
			name="caption"
			bind:value={caption}
			required
			maxlength="500"
			placeholder="Describe this memory..."
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-white placeholder-white/40 focus:border-(--accent-lime) focus:outline-none"
		/>
	</div>
	<div class="flex flex-col gap-2">
		<label for="memory-file" class="font-mono text-xs font-medium text-white/80">Image</label>
		<input
			id="memory-file"
			type="file"
			name="file"
			accept="image/jpeg,image/png,image/webp,image/gif"
			onchange={handleFileChange}
			required
			class="rounded border border-white/20 bg-black/40 px-3 py-2 font-mono text-xs text-white/80 file:mr-2 file:rounded file:border-0 file:bg-(--accent-lime) file:px-3 file:py-1 file:font-mono file:text-black file:uppercase"
		/>
		{#if filePreview}
			<img src={filePreview} alt="Preview" class="h-24 w-24 rounded object-cover" />
		{/if}
	</div>
	<button
		type="submit"
		disabled={isSubmitting || !file || !caption.trim()}
		class="rounded bg-(--accent-lime) px-4 py-2 font-mono text-xs font-bold tracking-widest text-black uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
	>
		{isSubmitting ? 'Adding...' : 'Add Memory'}
	</button>
</form>
