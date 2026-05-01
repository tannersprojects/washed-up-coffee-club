import type { Handle } from '@sveltejs/kit';
import { LoggingEvents } from '$lib/server/logging/events';
import { serializeError } from '$lib/server/logging/logger';
import { createRequestLogger, getOrCreateRequestId } from '$lib/server/logging/request-context';

export const requestLoggingHandle: Handle = async ({ event, resolve }) => {
	const requestId = getOrCreateRequestId(event.request);
	const url = new URL(event.request.url);

	event.locals.requestId = requestId;
	event.locals.logger = createRequestLogger(requestId, event.request.method, url.pathname);

	event.locals.logger.info(
		{
			event: LoggingEvents.SERVER_REQUEST_STARTED,
			path: url.pathname,
			hasQuery: url.search.length > 1
		},
		'request started'
	);

	const start = performance.now();

	try {
		const response = await resolve(event);
		const durationMs = Math.round(performance.now() - start);

		event.locals.logger.info(
			{
				event: LoggingEvents.SERVER_REQUEST_FINISHED,
				status: response.status,
				durationMs
			},
			'request finished'
		);

		response.headers.set('x-request-id', requestId);
		return response;
	} catch (err) {
		const durationMs = Math.round(performance.now() - start);

		event.locals.logger.error(
			{
				event: LoggingEvents.SERVER_REQUEST_FINISHED,
				status: 500,
				durationMs,
				err: serializeError(err)
			},
			'request failed'
		);

		throw err;
	}
};
