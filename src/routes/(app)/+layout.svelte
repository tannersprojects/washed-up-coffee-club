<script lang="ts">
	import { page } from '$app/state';
	import AppNav from '$lib/components/AppNav.svelte';
	import { getPageName } from '$lib/utils/page.js';
import type { PageName } from '$lib/constants';

	let { data, children } = $props();

	let pageName: PageName = $derived(getPageName(page.url.pathname));
</script>

<div
	class="flex min-h-screen w-full flex-col bg-[#050505] font-sans text-white selection:bg-(--accent-lime) selection:text-black"
>
	<AppNav profile={data.profile} {pageName} />

	<main class="relative flex flex-1 flex-col items-center pt-24 pb-20">
		{@render children()}
	</main>
</div>
