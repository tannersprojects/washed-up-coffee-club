<script lang="ts">
	import { PROFILE_ROLE } from '$lib/constants';
	import type { Profile } from '$lib/db/schema';
	import { PAGE_NAME, type PageName } from '$lib/types/pages';
	import { LayoutDashboard, Settings, LogOut } from 'lucide-svelte';

	type Props = {
		profile: Profile | null;
		pageName: PageName;
	};

	let { profile, pageName }: Props = $props();

	let dropdownOpen = $state(false);

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	function closeDropdown() {
		dropdownOpen = false;
	}

	function handleClickOutside(node: HTMLElement) {
		function onClick(event: MouseEvent) {
			if (node && !node.contains(event.target as Node)) {
				closeDropdown();
			}
		}
		document.addEventListener('click', onClick, true);
		return {
			destroy() {
				document.removeEventListener('click', onClick, true);
			}
		};
	}
</script>

<nav
	class="fixed top-0 z-40 flex w-full items-center justify-between border-b border-white/10 bg-[#050505]/80 px-6 py-4 backdrop-blur-md"
>
	<div class="flex items-center gap-2">
		<a href="/" class="group flex items-center gap-2">
			<div
				class="h-3 w-3 rounded-full bg-(--accent-lime) transition-transform group-hover:scale-110"
			></div>
			<span class="text-sm font-bold tracking-tight text-white uppercase">
				Washed Up Coffee Club
			</span>
		</a>
		<span class="mx-2 text-white/20">/</span>
		<span class="font-mono text-xs tracking-widest text-white/60 uppercase"
			>{PAGE_NAME[pageName].toUpperCase()}</span
		>
	</div>
	<div class="flex items-center gap-4">
		{#if pageName === PAGE_NAME.dashboard}
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
		{/if}
		<div class="relative" use:handleClickOutside>
			<button
				type="button"
				aria-haspopup="true"
				aria-expanded={dropdownOpen}
				aria-label="User menu"
				onclick={toggleDropdown}
				class="flex h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-white/20 bg-gray-800 transition-opacity hover:border-white/40 hover:opacity-90 focus:ring-2 focus:ring-(--accent-lime) focus:ring-offset-2 focus:ring-offset-[#050505] focus:outline-none"
			>
				{#if profile}
					<img
						src={`https://ui-avatars.com/api/?name=${profile.firstname}+${profile.lastname}&background=random&color=fff`}
						alt=""
						class="h-full w-full object-cover"
					/>
				{/if}
			</button>
			{#if dropdownOpen}
				<div
					class="absolute top-full right-0 z-50 mt-2 min-w-[160px] overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a]/95 py-1 shadow-xl backdrop-blur-md"
					role="menu"
				>
					{#if profile}
						<div class="border-b border-white/10 px-4 py-2 font-mono text-xs text-white/60">
							{profile.firstname}
							{profile.lastname}
						</div>
						{#if pageName !== PAGE_NAME.dashboard}
							<a
								href="/dashboard"
								role="menuitem"
								class="flex items-center gap-2 px-4 py-2 font-mono text-xs font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
							>
								<LayoutDashboard class="h-3 w-3" />
								<span>Dashboard</span>
							</a>
						{/if}
						{#if profile.role === PROFILE_ROLE.ADMIN && pageName !== PAGE_NAME.admin}
							<a
								href="/admin"
								role="menuitem"
								class="flex items-center gap-2 px-4 py-2 font-mono text-xs font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
							>
								<Settings class="h-3 w-3" />
								<span>Admin dashboard</span>
							</a>
						{/if}
					{/if}
					<form method="POST" action="/auth/logout" class="border-t border-white/10">
						<button
							type="submit"
							role="menuitem"
							class="flex w-full items-center gap-2 px-4 py-2 text-left font-mono text-xs font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
						>
							<LogOut class="h-3 w-3" />
							<span>Log out</span>
						</button>
					</form>
				</div>
			{/if}
		</div>
	</div>
</nav>
