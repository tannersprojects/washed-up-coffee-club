export const ADMIN_TAB = {
	Memories: 'memories',
	Schedules: 'schedules',
	Challenges: 'challenges',
	Content: 'content'
} as const;

export type AdminTab = (typeof ADMIN_TAB)[keyof typeof ADMIN_TAB];

export const ADMIN_TAB_LABEL = {
	Memories: 'Memories',
	Schedules: 'Schedules',
	Challenges: 'Challenges',
	Content: 'Content'
} as const;
