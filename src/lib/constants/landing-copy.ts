export const LANDING_COPY_SECTION = {
	Manifesto: 'manifesto'
} as const;

export type LandingCopySection = (typeof LANDING_COPY_SECTION)[keyof typeof LANDING_COPY_SECTION];

export const LANDING_COPY_KEY = {
	ManifestoEyebrow: 'manifesto.eyebrow',
	ManifestoHeadline: 'manifesto.headline',
	ManifestoDescription: 'manifesto.description',
	ManifestoVibeLabel: 'manifesto.vibe_label',
	ManifestoVibeQuote: 'manifesto.vibe_quote'
} as const;

export type LandingCopyKey = (typeof LANDING_COPY_KEY)[keyof typeof LANDING_COPY_KEY];
