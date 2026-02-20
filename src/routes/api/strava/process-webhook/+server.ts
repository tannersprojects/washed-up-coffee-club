import {
	WEBHOOK_ASPECT_TYPE,
	WEBHOOK_OBJECT_TYPE,
	WEBHOOK_STATUS,
	type WebhookStatus
} from '$lib/constants';
import { db } from '$lib/db';
import {
	stravaConnectionsTable,
	stravaWebhookLogsTable,
	type StravaWebhookLog
} from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { getActivityById, refreshConnectionIfNeeded } from '$lib/server/strava';
import { processActivityForChallenges } from '$lib/server/strava-activity-processor';

type StravaProcessWebhookRequestBody = {
	type: 'INSERT';
	table: 'strava_webhook_logs';
	record: StravaWebhookLog;
};

export const POST: RequestHandler = async ({ request }) => {
	console.log('PROCESSING STRAVA WEBHOOK');

	let record: StravaProcessWebhookRequestBody['record'];
	try {
		const body: StravaProcessWebhookRequestBody = await request.json();
		record = body.record;
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	if (record.objectType !== WEBHOOK_OBJECT_TYPE.ACTIVITY) {
		console.log(`Skipping non-activity webhook: ${record.objectType}`);
		await updateStravaWebhookLogStatus(record.id, WEBHOOK_STATUS.PROCESSED);
		return new Response('EVENT_RECEIVED', { status: 200 });
	}

	if (record.aspectType !== WEBHOOK_ASPECT_TYPE.CREATE) {
		console.log(`Skipping non-create webhook: ${record.aspectType}`);
		await updateStravaWebhookLogStatus(record.id, WEBHOOK_STATUS.PROCESSED);
		return new Response('EVENT_RECEIVED', { status: 200 });
	}

	if (!record.stravaAthleteId) {
		console.error('Strava athlete ID is required');
		await updateStravaWebhookLogStatus(
			record.id,
			WEBHOOK_STATUS.ERROR,
			'Strava athlete ID is required'
		);
		return new Response('ERROR: Strava athlete ID is required', { status: 500 });
	}

	if (!record.objectId) {
		console.error('Strava activity ID is required');
		await updateStravaWebhookLogStatus(
			record.id,
			WEBHOOK_STATUS.ERROR,
			'Strava activity ID is required'
		);
		return new Response('ERROR: Strava activity ID is required', { status: 500 });
	}

	let connection = await db.query.stravaConnectionsTable.findFirst({
		where: eq(stravaConnectionsTable.stravaAthleteId, record.stravaAthleteId)
	});

	if (!connection) {
		console.error('Strava connection not found');
		await updateStravaWebhookLogStatus(
			record.id,
			WEBHOOK_STATUS.ERROR,
			'Strava connection not found'
		);
		return new Response('ERROR: Strava connection not found', { status: 500 });
	}

	try {
		connection = await refreshConnectionIfNeeded(connection);
	} catch (refreshError) {
		const message = refreshError instanceof Error ? refreshError.message : 'Token refresh failed';
		console.error('Failed to refresh Strava token:', refreshError);
		await updateStravaWebhookLogStatus(record.id, WEBHOOK_STATUS.ERROR, message);
		return new Response('EVENT_RECEIVED', { status: 200 });
	}

	console.log('Validations complete. Fetching activity...');

	try {
		const stravaDetailedActivity = await getActivityById(
			record.objectId,
			true,
			connection.accessToken
		);

		console.log(
			`Processing activity ${stravaDetailedActivity.id} for connection ${connection.profileId}`
		);

		await processActivityForChallenges(stravaDetailedActivity, connection.profileId);
		await updateStravaWebhookLogStatus(record.id, WEBHOOK_STATUS.PROCESSED);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		console.error('Failed to process activity:', error);
		await updateStravaWebhookLogStatus(record.id, WEBHOOK_STATUS.ERROR, message);
		return new Response('EVENT_RECEIVED', { status: 200 });
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
