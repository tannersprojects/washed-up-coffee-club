<script lang="ts">
	let { data } = $props();
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<h1 class="mb-6 text-3xl font-bold text-gray-900">Dashboard</h1>

	<div class="rounded-lg bg-white p-6 shadow">
		<h2 class="mb-4 text-xl font-semibold text-gray-800">Welcome back!</h2>
		<p class="mb-4 text-gray-600">You're successfully authenticated with Strava.</p>

		{#if data.profile}
			<div class="space-y-2">
				{#if data.profile.firstname || data.profile.lastname}
					<p class="text-sm text-gray-600">
						<strong>Name:</strong>
						{data.profile.firstname || ''}
						{data.profile.lastname || ''}
					</p>
				{/if}
				{#if data.profile.username}
					<p class="text-sm text-gray-600">
						<strong>Strava Username:</strong>
						{data.profile.username}
					</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
