import { getContext, setContext } from 'svelte';
import type { AdminContextData } from '$lib/types/admin.js';
import { AdminUI } from './AdminUI.svelte';

const KEY = Symbol('ADMIN_CTX');

export function setAdminContext(data: AdminContextData): AdminUI {
	const admin = AdminUI.fromServerData(data);
	setContext<AdminUI>(KEY, admin);
	return admin;
}

export function getAdminContext(): AdminUI {
	return getContext<AdminUI>(KEY);
}
