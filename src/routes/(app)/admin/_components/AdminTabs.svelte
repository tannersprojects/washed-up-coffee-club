<script lang="ts">
	import Tabs from '$lib/components/Tabs.svelte';
	import { ADMIN_TAB, ADMIN_TAB_LABEL, type AdminTab } from '$lib/constants';
	import { getAdminContext } from '../_logic/context.js';

	const admin = getAdminContext();

	const tabs = [
		{ value: ADMIN_TAB.Memories, label: ADMIN_TAB_LABEL.Memories },
		{ value: ADMIN_TAB.Schedules, label: ADMIN_TAB_LABEL.Schedules },
		{ value: ADMIN_TAB.Challenges, label: ADMIN_TAB_LABEL.Challenges },
		{ value: ADMIN_TAB.Content, label: ADMIN_TAB_LABEL.Content }
	];
</script>

<Tabs
	{tabs}
	value={admin.activeTab}
	onSelect={(v) => admin.setActiveTab(v as AdminTab)}
	class="mb-8"
/>
