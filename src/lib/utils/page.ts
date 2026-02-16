import { PAGE_NAME, type PageName } from '$lib/constants';

export function getPageName(pathname: string): PageName {
	if (pathname.startsWith('/admin')) return PAGE_NAME.admin;
	if (pathname.startsWith('/dashboard')) return PAGE_NAME.dashboard;
	return PAGE_NAME.dashboard;
}
