export const PAGE_NAME = {
	dashboard: 'dashboard',
	admin: 'admin'
} as const;

export type PageName = (typeof PAGE_NAME)[keyof typeof PAGE_NAME];
