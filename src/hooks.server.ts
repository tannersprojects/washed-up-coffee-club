import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { getStravaConnection, getUserProfile } from '$lib/server/auth';
import { refreshAccessToken } from '$lib/server/strava';
import { db } from '$lib/db';
import { stravaConnectionsTable } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

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
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error || !user) {
			return { session: null, user: null };
		}

		// TODO: Should this be done here or in an api client?
		try {
			const connection = await getStravaConnection(user.id);
			if (connection) {
				const expiresAt = new Date(connection.expiresAt);
				const now = new Date();
				const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

				if (expiresAt <= fiveMinutesFromNow) {
					try {
						const newTokens = await refreshAccessToken(connection.refreshToken);

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
						console.error('Failed to refresh Strava token:', refreshError);
					}
				}
			}
		} catch (err) {
			console.error('Error checking Strava connection:', err);
		}

		return { session, user };
	};

	return resolve(event);
};

const profileHandle: Handle = async ({ event, resolve }) => {
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
		event.locals.profile = null;
	} else {
		try {
			event.locals.profile = await getUserProfile(user.id);
		} catch (err) {
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
