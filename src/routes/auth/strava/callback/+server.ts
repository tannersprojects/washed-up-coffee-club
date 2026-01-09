import { redirect } from '@sveltejs/kit';

import { exchangeCodeForToken } from '$lib/server/strava';
import { findOrCreateShadowUser } from '$lib/server/auth';

import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';

export const GET = async ({ url, cookies, locals }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	// Handle OAuth errors
	if (error) {
		console.error('Strava OAuth error:', error);
		throw redirect(302, '/login?error=oauth_denied');
	}

	// Validate state token
	const storedState = cookies.get('strava_oauth_state');
	if (!storedState || storedState !== state) {
		console.error('CSRF state mismatch');
		throw redirect(302, '/login?error=invalid_state');
	}

	// Clear state cookie
	cookies.delete('strava_oauth_state', { path: '/' });

	if (!code) {
		throw redirect(302, '/login?error=missing_code');
	}

	try {
		console.log('=== OAuth Callback Started ===');
		console.log('Code received:', code ? 'present' : 'missing');
		console.log('State received:', state);

		// Exchange code for tokens
		console.log('Exchanging code for tokens...');
		const tokenResponse = await exchangeCodeForToken(code);
		console.log('Token exchange successful. Athlete ID:', tokenResponse.athlete.id);

		// Find or create shadow user
		console.log('Finding or creating shadow user...');
		const userId = await findOrCreateShadowUser(tokenResponse.athlete, tokenResponse);
		console.log('User ID:', userId);

		// Create session using admin API - generate magic link and extract tokens
		const adminClient = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		});

		console.log('Fetching user data...');
		const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId);
		if (userError) {
			console.error('Error fetching user:', userError);
		}
		if (!userData?.user?.email) {
			console.error('User email not found. UserData:', JSON.stringify(userData, null, 2));
			throw redirect(302, '/login?error=user_not_found');
		}
		console.log('User email:', userData.user.email);

		// Generate magic link - this creates a verification token
		console.log('Generating magic link...');
		const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
			type: 'magiclink',
			email: userData.user.email
		});

		if (linkError || !linkData?.properties?.hashed_token) {
			console.error('Failed to generate magic link. Error:', linkError);
			console.error('LinkData:', linkData);
			throw redirect(302, '/login?error=session_failed');
		}

		console.log('Magic link generated. Verifying token to get session...');

		// Verify the magic link token to get a session
		// This is the correct way to convert a magic link into a session
		const { data: verifyData, error: verifyError } = await adminClient.auth.verifyOtp({
			token_hash: linkData.properties.hashed_token,
			type: 'magiclink'
		});

		if (verifyError || !verifyData?.session) {
			console.error('Failed to verify magic link token. Error:', verifyError);
			console.error('VerifyData:', verifyData);
			throw redirect(302, '/login?error=session_failed');
		}

		console.log('Token verified successfully. Session obtained.');

		// Set session on the server client using tokens from verification
		console.log('Setting session...');
		const { error: sessionError, data: sessionData } = await locals.supabase.auth.setSession({
			access_token: verifyData.session.access_token,
			refresh_token: verifyData.session.refresh_token
		});

		if (sessionError) {
			console.error('Failed to set session:', sessionError);
			console.error('Session error details:', JSON.stringify(sessionError, null, 2));
			throw redirect(302, '/login?error=session_set_failed');
		}

		console.log('Session set successfully');
		console.log('Session user:', sessionData?.user?.id);

		// Success - redirect outside of try/catch
		console.log('Redirecting to dashboard...');
		throw redirect(302, '/');
	} catch (err) {
		// Check if this is already a redirect (from SvelteKit)
		if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
			// This is a SvelteKit redirect, re-throw it
			throw err;
		}

		// Log actual errors
		console.error('OAuth callback error:', err);
		throw redirect(302, '/login?error=unknown');
	}
};
