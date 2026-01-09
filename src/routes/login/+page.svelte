<script lang="ts">
	import { page } from '$app/stores';

	let error = $derived($page.url.searchParams.get('error'));

	const errorMessages: Record<string, string> = {
		oauth_denied: 'Authorization was denied. Please try again.',
		invalid_state: 'Security validation failed. Please try again.',
		missing_code: 'Authorization code missing. Please try again.',
		session_failed: 'Failed to create session. Please try again.',
		token_extraction_failed: 'Failed to process authentication. Please try again.',
		session_set_failed: 'Failed to set session. Please try again.',
		unknown: 'An unknown error occurred. Please try again.'
	};
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<h1 class="mb-2 text-4xl font-bold text-gray-900">Washed Up Coffee Club</h1>
			<p class="text-gray-600">Sign in to access your run club dashboard</p>
		</div>

		{#if error}
			<div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">
				<p class="text-sm">{errorMessages[error] || errorMessages.unknown}</p>
			</div>
		{/if}

		<div class="rounded-lg bg-white p-8 shadow-md">
			<a
				href="/auth/strava/login"
				class="flex w-full items-center justify-center gap-3 rounded-md bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
			>
				<svg
					class="h-6 w-6"
					fill="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M15.387 17.944l-2.089-4.116 2.085-4.107 3.037.623-5.112 9.825h3.079l2.089-4.107 2.085-4.116-3.075-.623zM10.113 7.16l-2.085 4.107L6.039 15.383l-3.037-.623 5.112-9.825H5.035l-2.085 4.107L.865 9.842l3.037.623z"
					/>
				</svg>
				Connect with Strava
			</a>
		</div>

		<p class="text-center text-sm text-gray-500">
			By connecting, you agree to share your Strava activity data with the club.
		</p>
	</div>
</div>
