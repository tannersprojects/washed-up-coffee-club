<script lang="ts">
	import { PROFILE_ROLE } from '$lib/constants';
	import type { Profile } from '$lib/db/schema';
	import { PAGE_NAME, type PageName } from '$lib/types/pages';
	import { LayoutDashboard, Settings, LogOut, Menu, X } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	type Props = {
		profile: Profile | null;
		pageName: PageName;
	};

	let { profile, pageName }: Props = $props();

	let dropdownOpen = $state(false);
	let drawerOpen = $state(false);

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	function closeDropdown() {
		dropdownOpen = false;
	}

	function openDrawer() {
		drawerOpen = true;
	}

	function closeDrawer() {
		drawerOpen = false;
	}

	function toggleDrawer() {
		if (drawerOpen) {
			closeDrawer();
		} else {
			openDrawer();
		}
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

	// Handle Escape key and body scroll lock for drawer
	$effect(() => {
		if (drawerOpen) {
			// Lock body scroll
			document.body.style.overflow = 'hidden';

			// Handle Escape key
			function handleEscape(event: KeyboardEvent) {
				if (event.key === 'Escape') {
					closeDrawer();
				}
			}
			document.addEventListener('keydown', handleEscape);

			return () => {
				// Restore body scroll
				document.body.style.overflow = '';
				document.removeEventListener('keydown', handleEscape);
			};
		}
	});
</script>

<nav
	class="fixed top-0 z-40 flex w-full items-center justify-between border-b border-white/10 bg-[#050505]/80 px-6 py-4 backdrop-blur-md"
>
	<div class="flex items-center gap-2">
		<a href="/" class="group flex items-center gap-2">
			<div
				class="h-3 w-3 rounded-full bg-(--accent-lime) transition-transform group-hover:scale-110"
			></div>
			<span class="text-sm font-bold tracking-tight text-white uppercase md:hidden">WUCC</span>
			<span class="hidden text-sm font-bold tracking-tight text-white uppercase md:inline"
				>Washed Up Coffee Club</span
			>
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

		<!-- Mobile: Hamburger menu -->
		<button
			type="button"
			aria-label="Open menu"
			aria-expanded={drawerOpen}
			onclick={toggleDrawer}
			class="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-white/10 focus:ring-2 focus:ring-(--accent-lime) focus:ring-offset-2 focus:ring-offset-[#050505] focus:outline-none md:hidden"
		>
			<Menu class="h-6 w-6 text-white" />
		</button>

		<!-- Desktop: Avatar dropdown -->
		<div class="relative hidden md:block" use:handleClickOutside>
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
					class="absolute top-full right-0 z-50 mt-2 min-w-[220px] overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a]/95 py-1 shadow-xl backdrop-blur-md"
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
								class="flex items-center gap-2 px-4 py-2 font-mono text-xs font-medium whitespace-nowrap text-white/90 transition-colors hover:bg-white/10 hover:text-white"
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

<!-- Mobile Drawer -->
{#if drawerOpen}
	<!-- Overlay -->
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-50 bg-black/60"
		onclick={closeDrawer}
		role="presentation"
	></div>

	<!-- Drawer Panel -->
	<div
		transition:fly={{ x: 300, duration: 250, easing: cubicOut }}
		class="fixed top-0 right-0 bottom-0 z-50 flex w-72 max-w-[85vw] flex-col border-l border-white/10 bg-[#050505]/95 shadow-xl backdrop-blur-md"
		role="dialog"
		aria-modal="true"
		aria-label="Menu"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => {
			if (e.key === 'Escape') closeDrawer();
		}}
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-white/10 px-6 py-4">
			<span class="font-mono text-sm font-bold tracking-tight text-white uppercase">Menu</span>
			<button
				type="button"
				aria-label="Close menu"
				onclick={closeDrawer}
				class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10 focus:ring-2 focus:ring-(--accent-lime) focus:outline-none"
			>
				<X class="h-5 w-5 text-white" />
			</button>
		</div>

		<!-- Body -->
		<div class="flex-1 overflow-y-auto px-6 py-6">
			{#if profile}
				<!-- User block -->
				<div class="mb-6 flex items-center gap-3">
					<img
						src={`https://ui-avatars.com/api/?name=${profile.firstname}+${profile.lastname}&background=random&color=fff`}
						alt=""
						class="h-12 w-12 rounded-full border border-white/20"
					/>
					<div class="flex flex-col">
						<span class="font-mono text-sm font-medium text-white">
							{profile.firstname}
							{profile.lastname}
						</span>
					</div>
				</div>

				<!-- Navigation links -->
				<nav class="space-y-2">
					{#if pageName !== PAGE_NAME.dashboard}
						<a
							href="/dashboard"
							onclick={closeDrawer}
							class="flex items-center gap-3 rounded-lg px-4 py-3 font-mono text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
						>
							<LayoutDashboard class="h-5 w-5" />
							<span>Dashboard</span>
						</a>
					{/if}
					{#if profile.role === PROFILE_ROLE.ADMIN && pageName !== PAGE_NAME.admin}
						<a
							href="/admin"
							onclick={closeDrawer}
							class="flex items-center gap-3 rounded-lg px-4 py-3 font-mono text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
						>
							<Settings class="h-5 w-5" />
							<span>Admin dashboard</span>
						</a>
					{/if}
				</nav>
			{/if}
		</div>

		<!-- Footer: Logout -->
		<div class="border-t border-white/10 px-6 py-4">
			<form method="POST" action="/auth/logout">
				<button
					type="submit"
					class="flex w-full items-center gap-3 rounded-lg px-4 py-3 font-mono text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
				>
					<LogOut class="h-5 w-5" />
					<span>Log out</span>
				</button>
			</form>
		</div>
	</div>
{/if}
