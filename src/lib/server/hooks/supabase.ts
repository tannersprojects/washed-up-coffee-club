import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { getStravaConnection } from '$lib/server/auth';
import { LoggingEvents } from '$lib/server/logging/events';
import { serializeError } from '$lib/server/logging/logger';
import { refreshConnectionIfNeeded } from '$lib/server/strava/client';

export const supabaseHandle: Handle = async ({ event, resolve }) => {
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
				try {
					await refreshConnectionIfNeeded(connection);
				} catch (refreshError) {
					event.locals.logger.error(
						{
							event: LoggingEvents.SERVER_SESSION_STRAVA_REFRESH_FAILED,
							err: serializeError(refreshError)
						},
						'Failed to refresh Strava token'
					);
				}
			}
		} catch (err) {
			event.locals.logger.error(
				{
					event: LoggingEvents.SERVER_SESSION_STRAVA_CONNECTION_CHECK_FAILED,
					err: serializeError(err)
				},
				'Error checking Strava connection'
			);
		}

		return { session, user };
	};

	return resolve(event);
};
