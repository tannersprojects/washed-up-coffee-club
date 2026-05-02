import { WEBHOOK_STATUS, type WebhookStatus } from '$lib/constants';
import { db } from '$lib/db';
import { stravaWebhookLogsTable, type StravaWebhookLog } from '$lib/db/schema';
import { LoggingEvents } from '$lib/server/logging/events';
import { serializeError } from '$lib/server/logging/logger';
import { processActivity } from '$lib/server/strava/processors/activity-processor';
import { validateWebhookRecord } from './_logic/webhook-validator';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

type StravaProcessWebhookRequestBody = {
	type: 'INSERT';
	table: 'strava_webhook_logs';
	record: StravaWebhookLog;
};

export const POST: RequestHandler = async ({ locals: { logger }, request }) => {
	let record: StravaProcessWebhookRequestBody['record'];
	try {
		const body: StravaProcessWebhookRequestBody = await request.json();
		record = body.record;
	} catch {
		logger.warn(
			{ event: LoggingEvents.STRAVA_WEBHOOK_PROCESS_INVALID_JSON },
			'process-webhook invalid JSON'
		);
		return new Response('Invalid JSON', { status: 400 });
	}

	const log = logger.child({
		webhookLogId: record.id,
		aspectType: record.aspectType,
		objectType: record.objectType,
		activityId: record.objectId ?? undefined,
		stravaAthleteId: record.stravaAthleteId ?? undefined
	});

	log.info({ event: LoggingEvents.STRAVA_WEBHOOK_PROCESS_STARTED }, 'webhook process started');

	const validation = await validateWebhookRecord(record);

	if (!validation.ok) {
		const status = validation.skip ? WEBHOOK_STATUS.PROCESSED : WEBHOOK_STATUS.ERROR;
		const errorMessage = validation.skip ? undefined : validation.reason;

		if (validation.skip) {
			log.warn(
				{ event: LoggingEvents.STRAVA_WEBHOOK_PROCESS_SKIPPED, reason: validation.reason },
				'webhook validation skipped'
			);
		} else {
			log.error(
				{ event: LoggingEvents.STRAVA_WEBHOOK_PROCESS_FAILED, reason: validation.reason },
				'webhook validation failed'
			);
		}

		await updateStravaWebhookLogStatus(record.id, status, errorMessage);
		return new Response('EVENT_RECEIVED', { status: 200 });
	}

	try {
		const { aspectType, objectId: activityId, connection } = validation;
		await processActivity(aspectType, activityId, connection, { webhookLogId: record.id });
		await updateStravaWebhookLogStatus(record.id, WEBHOOK_STATUS.PROCESSED);
		log.info(
			{ event: LoggingEvents.STRAVA_WEBHOOK_PROCESS_COMPLETED },
			'webhook process completed'
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		log.error(
			{ event: LoggingEvents.STRAVA_WEBHOOK_PROCESS_FAILED, err: serializeError(error) },
			'webhook process failed'
		);
		await updateStravaWebhookLogStatus(record.id, WEBHOOK_STATUS.ERROR, message);
	}

	return new Response('EVENT_RECEIVED', { status: 200 });
};

async function updateStravaWebhookLogStatus(
	stravaWebhookLogId: string,
	status: WebhookStatus,
	errorMessage?: string
): Promise<void> {
	await db
		.update(stravaWebhookLogsTable)
		.set({
			status,
			...(status === WEBHOOK_STATUS.ERROR && errorMessage != null && { errorMessage })
		})
		.where(eq(stravaWebhookLogsTable.id, stravaWebhookLogId));
}
