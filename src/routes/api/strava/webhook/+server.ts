import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STRAVA_WEBHOOK_VERIFY_TOKEN } from '$env/static/private';
import { db } from '$lib/db';
import { stravaWebhookLogsTable } from '$lib/db/schema';
import { LoggingEvents } from '$lib/server/logging/events';
import { serializeError } from '$lib/server/logging/logger';
import type { StravaWebhookPayload } from '$lib/types/strava';

export const GET: RequestHandler = async ({ url, locals: { logger } }) => {
	const mode = url.searchParams.get('hub.mode');
	const token = url.searchParams.get('hub.verify_token');
	const challenge = url.searchParams.get('hub.challenge');

	if (mode === 'subscribe' && token === STRAVA_WEBHOOK_VERIFY_TOKEN) {
		logger.info(
			{ event: LoggingEvents.STRAVA_WEBHOOK_HANDSHAKE_OK },
			'webhook subscription handshake ok'
		);
		return json({ 'hub.challenge': challenge });
	}
	return new Response('Forbidden', { status: 403 });
};

export const POST: RequestHandler = async ({ locals: { logger }, request }) => {
	try {
		const raw: unknown = await request.json();
		const body = raw as StravaWebhookPayload;

		logger.info(
			{ event: LoggingEvents.STRAVA_WEBHOOK_RECEIVED, ...body },
			'webhook payload received'
		);

		const [inserted] = await db
			.insert(stravaWebhookLogsTable)
			.values({
				payload: body,
				stravaAthleteId: body.owner_id,
				objectId: body.object_id,
				objectType: body.object_type,
				aspectType: body.aspect_type,
				eventTime: body.event_time
			})
			.returning({ id: stravaWebhookLogsTable.id });

		if (!inserted) {
			throw new Error('Insert did not return a row id');
		}

		const webhookLogId = inserted.id;
		logger
			.child({ webhookLogId })
			.info({ event: LoggingEvents.STRAVA_WEBHOOK_PERSISTED, ...body }, 'webhook log persisted');

		return new Response('EVENT_RECEIVED', { status: 200 });
	} catch (err) {
		logger.error(
			{ event: LoggingEvents.STRAVA_WEBHOOK_INGEST_FAILED, err: serializeError(err) },
			'webhook ingest failed'
		);
		// Return 200 even on error to prevent Strava from retrying
		return new Response('EVENT_RECEIVED', { status: 200 });
	}
};
