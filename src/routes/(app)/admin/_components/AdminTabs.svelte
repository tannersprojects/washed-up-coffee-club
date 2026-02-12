<script lang="ts">
	import Tabs from '$lib/components/Tabs.svelte';
	import { AdminTabValue, AdminTabLabel } from '$lib/types/admin.js';
	import type { AdminTab } from '../_logic/AdminUI.svelte.js';
	import { getAdminContext } from '../_logic/context.js';

	const admin = getAdminContext();

	const tabs = [
		{ value: AdminTabValue.Memories, label: AdminTabLabel.Memories },
		{ value: AdminTabValue.Schedules, label: AdminTabLabel.Schedules },
		{ value: AdminTabValue.Challenges, label: AdminTabLabel.Challenges }
	];
</script>

<Tabs
	{tabs}
	value={admin.activeTab}
	onSelect={(v) => admin.setActiveTab(v as AdminTab)}
	class="mb-8"
/>
