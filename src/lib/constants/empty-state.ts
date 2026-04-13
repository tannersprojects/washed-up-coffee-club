export const EMPTY_STATE_VARIANT = {
	/** Full-page centered layout: fills viewport, large title, used when entire view is empty. */
	FULL_PAGE: 'full-page' as const,
	/** Inline section layout: bordered, within content flow, used when a section has no items. */
	INLINE: 'inline' as const
} as const;

export type EmptyStateVariant = (typeof EMPTY_STATE_VARIANT)[keyof typeof EMPTY_STATE_VARIANT];

export const EMPTY_STATE_CONTAINER_CLASS: Record<EmptyStateVariant, string> = {
	[EMPTY_STATE_VARIANT.FULL_PAGE]: 'flex grow flex-1 w-full items-center justify-center',
	[EMPTY_STATE_VARIANT.INLINE]: 'border-b border-white/5 py-20 text-center'
};
