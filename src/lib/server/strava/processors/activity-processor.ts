import { WEBHOOK_ASPECT_TYPE, type WebhookAspectType } from '$lib/constants/strava';
import type { StravaConnection } from '$lib/db/schema';
import { LoggingEvents } from '$lib/server/logging/events';
import { logger, serializeError } from '$lib/server/logging/logger';
import type { WebhookCorrelation } from '$lib/server/strava/webhook-correlation';
import { getActivityById } from '../client';
import { processCreateActivity } from './activity-create-processor';
import { processDeleteActivity } from './activity-delete-processor';
import { processUpdateActivity } from './activity-update-processor';

type ActivityHandler = (
	activityId: number,
	connection: StravaConnection,
	correlation?: WebhookCorrelation
) => Promise<void>;

const ACTIVITY_HANDLERS = {
	[WEBHOOK_ASPECT_TYPE.CREATE]: handleCreateActivity,
	[WEBHOOK_ASPECT_TYPE.UPDATE]: handleUpdateActivity,
	[WEBHOOK_ASPECT_TYPE.DELETE]: handleDeleteActivity
} satisfies Record<WebhookAspectType, ActivityHandler>;

export async function processActivity(
	aspectType: WebhookAspectType,
	activityId: number,
	connection: StravaConnection,
	correlation?: WebhookCorrelation
): Promise<void> {
	const procLog = logger.child({
		profileId: connection.profileId,
		activityId,
		aspectType,
		...(correlation?.webhookLogId != null && { webhookLogId: correlation.webhookLogId })
	});

	procLog.info({ event: LoggingEvents.STRAVA_ACTIVITY_PROCESS_STARTED }, 'activity process started');

	try {
		const handler = ACTIVITY_HANDLERS[aspectType];
		await handler(activityId, connection, correlation);
		procLog.info({ event: LoggingEvents.STRAVA_ACTIVITY_PROCESS_COMPLETED }, 'activity process completed');
	} catch (err) {
		procLog.error(
			{ event: LoggingEvents.STRAVA_ACTIVITY_PROCESS_FAILED, err: serializeError(err) },
			'activity process failed'
		);
		throw err;
	}
}

async function handleCreateActivity(
	activityId: number,
	connection: StravaConnection,
	correlation?: WebhookCorrelation
): Promise<void> {
	const activity = await getActivityById(activityId, true, connection.accessToken);
	await processCreateActivity(activity, connection.profileId, correlation);
}

async function handleUpdateActivity(
	activityId: number,
	connection: StravaConnection,
	correlation?: WebhookCorrelation
): Promise<void> {
	void activityId;
	void connection;
	void correlation;
	await processUpdateActivity();
}

async function handleDeleteActivity(
	activityId: number,
	connection: StravaConnection,
	correlation?: WebhookCorrelation
): Promise<void> {
	void activityId;
	void connection;
	void correlation;
	await processDeleteActivity();
}
