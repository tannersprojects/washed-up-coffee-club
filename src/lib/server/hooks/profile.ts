import type { Handle } from '@sveltejs/kit';
import { getUserProfile } from '$lib/server/auth';
import { LoggingEvents } from '$lib/server/logging/events';
import { serializeError } from '$lib/server/logging/logger';
import { supabaseSerializedResponseHeadersFilter } from './serialized-headers';

export const profileHandle: Handle = async ({ event, resolve }) => {
	if (!event.locals.safeGetSession) {
		event.locals.profile = null;
		return resolve(event, {
			filterSerializedResponseHeaders: supabaseSerializedResponseHeadersFilter
		});
	}

	const { user } = await event.locals.safeGetSession();

	if (!user) {
		event.locals.profile = null;
	} else {
		try {
			event.locals.profile = await getUserProfile(user.id);
		} catch (err) {
			event.locals.logger.error(
				{
					event: LoggingEvents.SERVER_SESSION_PROFILE_LOAD_FAILED,
					err: serializeError(err)
				},
				'Error loading user profile'
			);
			event.locals.profile = null;
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders: supabaseSerializedResponseHeadersFilter
	});
};
