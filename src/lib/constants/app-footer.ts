export const APP_FOOTER_VARIANT = {
	STRAVA: 'strava' as const,
	STANDARD: 'standard' as const
} as const;

export type AppFooterVariant = (typeof APP_FOOTER_VARIANT)[keyof typeof APP_FOOTER_VARIANT];
