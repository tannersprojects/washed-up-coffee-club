export const PROFILE_ROLE = {
	ADMIN: 'admin' as const,
	USER: 'user' as const
} as const;

export type ProfileRole = (typeof PROFILE_ROLE)[keyof typeof PROFILE_ROLE];
