<script lang="ts">
	import type { Profile } from '$lib/db/schema';

	type Props = {
		profile: Profile | null;
	};

	let { profile }: Props = $props();
</script>

<nav
	class="fixed top-0 z-40 flex w-full items-center justify-between border-b border-white/10 bg-[#050505]/80 px-6 py-4 backdrop-blur-md"
>
	<div class="flex items-center gap-2">
		<a href="/" class="group flex items-center gap-2">
			<div
				class="h-3 w-3 rounded-full bg-(--accent-lime) transition-transform group-hover:scale-110"
			></div>
			<span class="text-sm font-bold tracking-tight text-white uppercase">Washed Up CC</span>
		</a>
		<span class="mx-2 text-white/20">/</span>
		<span class="font-mono text-xs tracking-widest text-white/60 uppercase">Dashboard</span>
	</div>
	<div class="flex items-center gap-4">
		<div
			class="hidden items-center gap-2 font-mono text-[10px] tracking-widest text-(--accent-lime) uppercase md:flex"
		>
			<span class="relative flex h-2 w-2">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--accent-lime) opacity-75"
				></span>
				<span class="relative inline-flex h-2 w-2 rounded-full bg-(--accent-lime)"></span>
			</span>
			Live Feed
		</div>
		<div class="h-8 w-8 overflow-hidden rounded-full border border-white/20 bg-gray-800">
			{#if profile}
				<img
					src={`https://ui-avatars.com/api/?name=${profile.firstname}+${profile.lastname}&background=random&color=fff`}
					alt="User"
					class="h-full w-full object-cover"
				/>
			{/if}
		</div>
	</div>
</nav>
