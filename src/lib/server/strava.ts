import { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REDIRECT_URI } from '$env/static/private';
import type { StravaTokenResponse, StravaErrorResponse } from '$lib/types/strava';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_OAUTH_BASE = 'https://www.strava.com/oauth';

/**
 * Generates the Strava OAuth authorization URL
 * @param state - CSRF state token for security
 * @returns Complete authorization URL
 */
export function generateAuthUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: STRAVA_CLIENT_ID,
		redirect_uri: STRAVA_REDIRECT_URI,
		response_type: 'code',
		scope: 'activity:read_all,profile:read_all',
		state
	});

	return `${STRAVA_OAUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchanges an authorization code for access and refresh tokens
 * @param code - Authorization code from Strava callback
 * @returns Token response with athlete data
 */
export async function exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
	const params = new URLSearchParams({
		client_id: STRAVA_CLIENT_ID,
		client_secret: STRAVA_CLIENT_SECRET,
		code,
		grant_type: 'authorization_code'
	});

	const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: params.toString()
	});

	if (!response.ok) {
		const error: StravaErrorResponse = await response.json();
		throw new Error(`Strava token exchange failed: ${error.message || 'Unknown error'}`);
	}

	const data = await response.json();

	console.log(data);

	return data;
}

/**
 * Refreshes an expired access token using the refresh token
 * @param refreshToken - Current refresh token
 * @returns New token response with updated tokens
 */
export async function refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse> {
	const params = new URLSearchParams({
		client_id: STRAVA_CLIENT_ID,
		client_secret: STRAVA_CLIENT_SECRET,
		refresh_token: refreshToken,
		grant_type: 'refresh_token'
	});

	const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: params.toString()
	});

	if (!response.ok) {
		const error: StravaErrorResponse = await response.json();
		throw new Error(`Strava token refresh failed: ${error.message || 'Unknown error'}`);
	}

	return response.json();
}
