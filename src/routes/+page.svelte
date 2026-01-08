<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	// Redirect to dashboard if logged in (reactive to data.session)
	$effect(() => {
		if (data.session) {
			goto('/dashboard');
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
	<div class="w-full max-w-md space-y-8 text-center">
		<div>
			<h1 class="mb-4 text-4xl font-bold text-gray-900">Washed Up Coffee Club</h1>
			<p class="mb-8 text-gray-600">
				Your community hub for run club events, leaderboards, and friendly competition.
			</p>
		</div>

		<div>
			<a
				href="/login"
				class="inline-block rounded-md bg-orange-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
			>
				Get Started
			</a>
		</div>
	</div>
</div>
