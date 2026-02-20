import { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REDIRECT_URI } from '$env/static/private';
import type {
	StravaDetailedActivityCamel,
	StravaErrorResponse,
	StravaTokenResponse
} from '$lib/types/strava';
import { keysToCamel } from '$lib/utils/case';
import { db } from '$lib/db';
import { stravaConnectionsTable, type StravaConnection } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const STRAVA_OAUTH_BASE = 'https://www.strava.com/oauth';

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

	return data;
}

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

export async function refreshConnectionIfNeeded(
	connection: StravaConnection
): Promise<StravaConnection> {
	const expiresAt = new Date(connection.expiresAt);
	const fiveMinutesFromNow = new Date(Date.now() + TOKEN_REFRESH_BUFFER_MS);

	if (expiresAt > fiveMinutesFromNow) return connection;

	const newTokens = await refreshAccessToken(connection.refreshToken);

	await db
		.update(stravaConnectionsTable)
		.set({
			accessToken: newTokens.access_token,
			refreshToken: newTokens.refresh_token,
			expiresAt: new Date(newTokens.expires_at * 1000),
			updatedAt: new Date()
		})
		.where(eq(stravaConnectionsTable.id, connection.id));

	return {
		...connection,
		accessToken: newTokens.access_token,
		refreshToken: newTokens.refresh_token,
		expiresAt: new Date(newTokens.expires_at * 1000),
		updatedAt: new Date()
	};
}

export async function getActivityById(
	activityId: number,
	includeAllEfforts: boolean,
	accessToken: string
): Promise<StravaDetailedActivityCamel> {
	const url = new URL(`${STRAVA_API_BASE}/activities/${activityId}`);
	url.searchParams.append('include_all_efforts', includeAllEfforts.toString());

	const response = await fetch(url.toString(), {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!response.ok) {
		let message = response.statusText;
		try {
			const errBody = (await response.json()) as { message?: string };
			if (errBody?.message) message = errBody.message;
		} catch {
			// Body wasn't JSON, keep statusText
		}
		throw new Error(`Failed to fetch activity: ${response.status} ${message}`);
	}

	let data: unknown;
	try {
		data = await response.json();
	} catch {
		throw new Error('Failed to parse activity response as JSON');
	}

	return keysToCamel<StravaDetailedActivityCamel>(data);
}
