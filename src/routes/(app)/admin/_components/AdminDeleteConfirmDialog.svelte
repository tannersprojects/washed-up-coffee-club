<script lang="ts">
	import { tick } from 'svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		open: boolean;
		title: string;
		titleId: string;
		descriptionId: string;
		busy?: boolean;
		children: Snippet;
		onclose: () => void;
		onconfirm: () => void;
	};

	let {
		open,
		title,
		titleId,
		descriptionId,
		busy = false,
		children,
		onclose,
		onconfirm
	}: Props = $props();

	let cancelButtonEl: HTMLButtonElement | undefined = $state();

	function handleClose() {
		if (busy) return;
		onclose();
	}

	$effect(() => {
		if (!open) return;

		void tick().then(() => {
			cancelButtonEl?.focus();
		});

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				handleClose();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	});
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<button
			type="button"
			class="absolute inset-0 cursor-default bg-black/70"
			aria-label="Close dialog"
			onclick={handleClose}
		></button>
		<div
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby={titleId}
			aria-describedby={descriptionId}
			class="relative z-10 w-full max-w-md rounded-lg border border-white/10 bg-black/90 p-4 shadow-xl outline-none backdrop-blur-sm"
		>
			<h2 id={titleId} class="font-mono text-sm font-bold text-white">
				{title}
			</h2>
			<div id={descriptionId} class="mt-2 font-mono text-xs text-white/70">
				{@render children()}
			</div>
			<div class="mt-4 flex justify-end gap-2">
				<button
					bind:this={cancelButtonEl}
					type="button"
					onclick={handleClose}
					class="rounded border border-white/20 px-3 py-1.5 font-mono text-xs text-white/80 hover:bg-white/5"
				>
					Cancel
				</button>
				<button
					type="button"
					disabled={busy}
					onclick={onconfirm}
					class="rounded bg-red-600 px-3 py-1.5 font-mono text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
				>
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}
