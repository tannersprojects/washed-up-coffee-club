/**
 * Stable `domain.action.stage` event names for structured logs.
 * Extend as phases 2–3 add webhook and business-flow instrumentation.
 */
export const LoggingEvents = {
	SERVER_REQUEST_STARTED: 'server.request.started',
	SERVER_REQUEST_FINISHED: 'server.request.finished',
	SERVER_SESSION_STRAVA_REFRESH_FAILED: 'server.session.strava_refresh_failed',
	SERVER_SESSION_STRAVA_CONNECTION_CHECK_FAILED: 'server.session.strava_connection_check_failed',
	SERVER_SESSION_PROFILE_LOAD_FAILED: 'server.session.profile_load_failed',
	STRAVA_WEBHOOK_RECEIVED: 'strava.webhook.received',
	STRAVA_WEBHOOK_PERSISTED: 'strava.webhook.persisted',
	STRAVA_WEBHOOK_INGEST_FAILED: 'strava.webhook.ingest_failed',
	STRAVA_WEBHOOK_HANDSHAKE_OK: 'strava.webhook.handshake_ok',
	STRAVA_WEBHOOK_PROCESS_STARTED: 'strava.webhook.process.started',
	STRAVA_WEBHOOK_PROCESS_SKIPPED: 'strava.webhook.process.skipped',
	STRAVA_WEBHOOK_PROCESS_COMPLETED: 'strava.webhook.process.completed',
	STRAVA_WEBHOOK_PROCESS_FAILED: 'strava.webhook.process.failed',
	STRAVA_WEBHOOK_PROCESS_INVALID_JSON: 'strava.webhook.process.invalid_json',
	CHALLENGE_JOIN_REQUESTED: 'challenge.join.requested',
	CHALLENGE_JOIN_SUCCEEDED: 'challenge.join.succeeded',
	CHALLENGE_JOIN_FAILED: 'challenge.join.failed',
	CHALLENGE_LEAVE_REQUESTED: 'challenge.leave.requested',
	CHALLENGE_LEAVE_SUCCEEDED: 'challenge.leave.succeeded',
	CHALLENGE_LEAVE_FAILED: 'challenge.leave.failed',
	STRAVA_ACTIVITY_PROCESS_STARTED: 'strava.activity.process.started',
	STRAVA_ACTIVITY_PROCESS_COMPLETED: 'strava.activity.process.completed',
	STRAVA_ACTIVITY_PROCESS_FAILED: 'strava.activity.process.failed',
	STRAVA_ACTIVITY_CHALLENGE_VALIDATED: 'strava.activity.challenge.validated',
	STRAVA_ACTIVITY_CHALLENGE_SKIPPED: 'strava.activity.challenge.skipped',
	STRAVA_ACTIVITY_CHALLENGE_CONTRIBUTION_INSERTED: 'strava.activity.challenge.contribution_inserted',
	STRAVA_ACTIVITY_CHALLENGE_DUPLICATE: 'strava.activity.challenge.duplicate',
	STRAVA_ACTIVITY_PARTICIPANT_STATE_UPDATED: 'strava.activity.participant_state.updated',
	STRAVA_ACTIVITY_CREATE_SUMMARY: 'strava.activity.create.summary'
} as const;

export type LoggingEventName = (typeof LoggingEvents)[keyof typeof LoggingEvents];
