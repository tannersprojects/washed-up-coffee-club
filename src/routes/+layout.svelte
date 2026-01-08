<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children, data } = $props();

	const isLoginPage = $derived(page.url.pathname === '/login');
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-gray-50">
	{#if data.session && !isLoginPage}
		<nav class="border-b bg-white shadow-sm">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 justify-between">
					<div class="flex items-center">
						<a href="/" class="text-xl font-bold text-gray-900">Washed Up Coffee Club</a>
					</div>
					<div class="flex items-center gap-4">
						<span class="text-sm text-gray-700">
							{data.user?.user_metadata?.firstname || data.user?.email}
						</span>
						<form method="POST" action="/auth/logout">
							<button
								type="submit"
								class="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
							>
								Logout
							</button>
						</form>
					</div>
				</div>
			</div>
		</nav>
	{/if}

	<main>
		{@render children()}
	</main>
</div>
