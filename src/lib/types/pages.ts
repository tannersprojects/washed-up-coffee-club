export const PAGE_NAME = {
	dashboard: 'dashboard',
	admin: 'admin'
} as const;

export type PageName = (typeof PAGE_NAME)[keyof typeof PAGE_NAME];

export function getPageName(pathname: string): PageName {
	if (pathname.startsWith('/admin')) return PAGE_NAME.admin;
	if (pathname.startsWith('/dashboard')) return PAGE_NAME.dashboard;
	return PAGE_NAME.dashboard;
}
