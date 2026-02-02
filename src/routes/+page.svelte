<script lang="ts">
	import { Spring } from 'svelte/motion';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { AUTH_ERROR_MESSAGES } from '$lib/constants';

	// Component Imports
	import { Navigation, Hero, Manifesto, CameraRoll, Routine, Footer } from './components';

	// --- PROPS & STATE ---
	let { data } = $props();
	let isLoggedIn = $derived(!!data.session);
	let memories = $derived(data.memories || []);
	let routineSchedule = $derived(data.routineSchedules || []);

	// Window binding state
	let innerHeight = $state(0);
	let innerWidth = $state(0);
	let scrollY = $state(0);

	// Check for authentication errors
	$effect(() => {
		const error = page.url.searchParams.get('error');
		if (error) {
			const message = AUTH_ERROR_MESSAGES[error] || AUTH_ERROR_MESSAGES.unknown;
			toast.error('Authentication Failed', {
				description: message,
				duration: 5000
			});

			const destination = resolve('/');
			goto(destination, { replaceState: true });
		}
	});

	// Global Spring Physics for Parallax
	const smoothScroll = new Spring(0, {
		stiffness: 0.1,
		damping: 0.25
	});

	$effect(() => {
		smoothScroll.target = scrollY;
	});
</script>

<svelte:window bind:scrollY bind:innerHeight bind:innerWidth />

<!-- GLOBAL WRAPPER -->
<div
	class="relative w-full bg-[#050505] font-sans text-white selection:bg-(--accent-lime) selection:text-black"
>
	<Navigation {scrollY} {isLoggedIn} />
	<Hero smoothScroll={smoothScroll.current} {scrollY} {innerHeight} {innerWidth} />
	<Manifesto />
	<CameraRoll {memories} {innerHeight} />
	<Routine {routineSchedule} smoothScroll={smoothScroll.current} />
	<Footer {isLoggedIn} />
</div>
