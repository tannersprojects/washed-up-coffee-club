import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { getStravaConnection, getUserProfile } from '$lib/server/auth';
import { refreshAccessToken } from '$lib/server/strava';
import { db } from '$lib/db';
import { stravaConnectionsTable } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * First handle: set up Supabase client and a safe session getter on locals.
 * This does NOT load the profile; it only returns { session, user } and
 * performs Strava token refresh when appropriate.
 */
const supabaseHandle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) =>
					event.cookies.set(name, value, { ...options, path: '/' })
				);
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			// No session – no user, no profile
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error || !user) {
			// JWT invalid or user not found
			return { session: null, user: null };
		}

		// Check and refresh Strava tokens if needed
		// TODO: Should this be done here or in an api client?
		try {
			const connection = await getStravaConnection(user.id);
			if (connection) {
				const expiresAt = new Date(connection.expiresAt);
				const now = new Date();
				const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

				// Refresh if expired or expiring within 5 minutes
				if (expiresAt <= fiveMinutesFromNow) {
					try {
						const newTokens = await refreshAccessToken(connection.refreshToken);

						// Update database with new tokens
						await db
							.update(stravaConnectionsTable)
							.set({
								accessToken: newTokens.access_token,
								refreshToken: newTokens.refresh_token,
								expiresAt: new Date(newTokens.expires_at * 1000),
								updatedAt: new Date()
							})
							.where(eq(stravaConnectionsTable.profileId, user.id));
					} catch (refreshError) {
						// Token refresh failed - user may need to re-authenticate
						console.error('Failed to refresh Strava token:', refreshError);
						// Don't throw - let the user continue, they'll need to re-auth when making Strava API calls
					}
				}
			}
		} catch (err) {
			// Error checking connection - continue without token refresh
			console.error('Error checking Strava connection:', err);
		}

		return { session, user };
	};

	// Pass control to the next handle in the sequence
	return resolve(event);
};

/**
 * Second handle: resolve the user's profile and attach it to event.locals.profile.
 * Ensures we only query for a profile when a user exists; otherwise profile is null.
 */
const profileHandle: Handle = async ({ event, resolve }) => {
	// If for some reason safeGetSession is missing, fall back gracefully
	if (!event.locals.safeGetSession) {
		event.locals.profile = null;
		return resolve(event, {
			filterSerializedResponseHeaders(name) {
				return name === 'content-range' || name === 'x-supabase-api-version';
			}
		});
	}

	const { user } = await event.locals.safeGetSession();

	if (!user) {
		// No authenticated user – ensure profile is null
		event.locals.profile = null;
	} else {
		try {
			event.locals.profile = await getUserProfile(user.id);
		} catch (err) {
			// This should be rare; log and ensure profile is null
			console.error('Error loading user profile:', err);
			event.locals.profile = null;
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

export const handle: Handle = sequence(supabaseHandle, profileHandle);
