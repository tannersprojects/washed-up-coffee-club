import { getContext, setContext } from 'svelte';
import type { AdminPageData } from '$lib/types/admin.js';
import { AdminUI } from './AdminUI.svelte';

const KEY = Symbol('ADMIN_CTX');

/** Same type as admin page load return; used by context and AdminUI. */
export type AdminServerData = AdminPageData;

export function setAdminContext(data: AdminPageData): AdminUI {
	const admin = AdminUI.fromServerData(data);
	setContext<AdminUI>(KEY, admin);
	return admin;
}

export function getAdminContext(): AdminUI {
	return getContext<AdminUI>(KEY);
}
