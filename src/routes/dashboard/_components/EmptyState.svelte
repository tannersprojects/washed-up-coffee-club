<script lang="ts">
	type Props = {
		title: string;
		message: string;
		variant?: 'no-challenge' | 'no-participants';
	};

	let { title, message, variant = 'no-participants' }: Props = $props();

	const containerClass = $derived(
		variant === 'no-challenge'
			? 'flex min-h-0 flex-1 w-full items-center justify-center'
			: 'border-b border-white/5 py-20 text-center'
	);
</script>

<div class={containerClass}>
	<div class="text-center">
		{#if variant === 'no-challenge'}
			<h2 class="text-2xl font-black text-gray-600 uppercase italic">{title}</h2>
		{:else}
			<p class="font-mono text-xs tracking-widest text-gray-500 uppercase">{title}</p>
		{/if}
		{#if variant === 'no-participants'}
			<p class="mt-2 text-white">{message}</p>
		{:else}
			<p class="mt-2 font-mono text-xs tracking-widest text-gray-500 uppercase">{message}</p>
		{/if}
	</div>
</div>
