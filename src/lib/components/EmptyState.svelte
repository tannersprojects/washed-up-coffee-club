<script lang="ts">
	import {
		EMPTY_STATE_CONTAINER_CLASS,
		EMPTY_STATE_VARIANT,
		type EmptyStateVariant
	} from '$lib/constants';

	type Props = {
		title: string;
		message: string;
		variant?: EmptyStateVariant;
	};

	let { title, message, variant = EMPTY_STATE_VARIANT.INLINE }: Props = $props();

	const isFullPage = $derived(variant === EMPTY_STATE_VARIANT.FULL_PAGE);
	const containerClass = $derived(EMPTY_STATE_CONTAINER_CLASS[variant]);
</script>

<div class={containerClass}>
	<div class="text-center">
		{#if isFullPage}
			<h2 class="text-2xl font-black text-gray-600 uppercase italic">{title}</h2>
			<p class="mt-2 font-mono text-xs tracking-widest text-gray-500 uppercase">{message}</p>
		{:else}
			<p class="font-mono text-xs tracking-widest text-gray-500 uppercase">{title}</p>
			<p class="mt-2 text-white">{message}</p>
		{/if}
	</div>
</div>
