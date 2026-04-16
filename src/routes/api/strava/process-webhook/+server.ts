import { WEBHOOK_STATUS, type WebhookStatus } from '$lib/constants';
import { db } from '$lib/db';
import { stravaWebhookLogsTable, type StravaWebhookLog } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { processActivity } from '$lib/server/strava/processors/activity-processor';
import { validateWebhookRecord } from './_logic/webhook-validator';

type StravaProcessWebhookRequestBody = {
	type: 'INSERT';
	table: 'strava_webhook_logs';
	record: StravaWebhookLog;
};

export const POST: RequestHandler = async ({ request }) => {
	let record: StravaProcessWebhookRequestBody['record'];
	try {
		const body: StravaProcessWebhookRequestBody = await request.json();
		record = body.record;
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	const validation = await validateWebhookRecord(record);

	if (!validation.ok) {
		const status = validation.skip ? WEBHOOK_STATUS.PROCESSED : WEBHOOK_STATUS.ERROR;
		const errorMessage = validation.skip ? undefined : validation.reason;
		console.log(validation.reason);
		await updateStravaWebhookLogStatus(record.id, status, errorMessage);
		return new Response('EVENT_RECEIVED', { status: 200 });
	}

	try {
		const { aspectType, objectId: activityId, connection } = validation;
		await processActivity(aspectType, activityId, connection);
		await updateStravaWebhookLogStatus(record.id, WEBHOOK_STATUS.PROCESSED);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		console.error('Failed to process activity:', error);
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
