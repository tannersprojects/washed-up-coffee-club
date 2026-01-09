import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { getStravaConnection, getUserProfile } from '$lib/server/auth';
import { refreshAccessToken } from '$lib/server/strava';
import { db } from '$lib/db';
import { stravaConnectionsTable } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
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
			event.locals.profile = null;
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			// JWT validation has failed
			event.locals.profile = null;
			return { session: null, user: null };
		}

		// Load profile data from database and set on locals
		// Profile is available via event.locals.profile, not returned from safeGetSession
		if (user) {
			try {
				event.locals.profile = await getUserProfile(user.id);
			} catch (err) {
				console.error('Error loading user profile:', err);
				event.locals.profile = null;
			}
		} else {
			event.locals.profile = null;
		}

		// Check and refresh Strava tokens if needed
		if (user) {
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
								.where(eq(stravaConnectionsTable.userId, user.id));
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
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
