import { redirect } from '@sveltejs/kit';
import { generateAuthUrl } from '$lib/server/strava';

export const GET = async ({ cookies }) => {
	// Generate CSRF state token
	const state = crypto.randomUUID();

	// Store state in httpOnly cookie with 5-minute expiration
	cookies.set('strava_oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 5 // 5 minutes
	});

	// Redirect to Strava OAuth
	const authUrl = generateAuthUrl(state);
	throw redirect(302, authUrl);
};
