/**
 * Stable `domain.action.stage` event names for structured logs.
 * Extend as phases 2–3 add webhook and business-flow instrumentation.
 */
export const LoggingEvents = {
	SERVER_REQUEST_STARTED: 'server.request.started',
	SERVER_REQUEST_FINISHED: 'server.request.finished',
	SERVER_SESSION_STRAVA_REFRESH_FAILED: 'server.session.strava_refresh_failed',
	SERVER_SESSION_STRAVA_CONNECTION_CHECK_FAILED: 'server.session.strava_connection_check_failed',
	SERVER_SESSION_PROFILE_LOAD_FAILED: 'server.session.profile_load_failed'
} as const;

export type LoggingEventName = (typeof LoggingEvents)[keyof typeof LoggingEvents];
