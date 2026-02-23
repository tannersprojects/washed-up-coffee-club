import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STRAVA_WEBHOOK_VERIFY_TOKEN } from '$env/static/private';
import { db } from '$lib/db';
import { stravaWebhookLogsTable } from '$lib/db/schema';
import type { StravaWebhookPayload } from '$lib/types/strava';

export const GET: RequestHandler = async ({ url }) => {
	const mode = url.searchParams.get('hub.mode');
	const token = url.searchParams.get('hub.verify_token');
	const challenge = url.searchParams.get('hub.challenge');

	if (mode === 'subscribe' && token === STRAVA_WEBHOOK_VERIFY_TOKEN) {
		console.log('Webhook handshake successful');
		return json({ 'hub.challenge': challenge });
	}
	return new Response('Forbidden', { status: 403 });
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		// TODO: Add logging
		const body = (await request.json()) as StravaWebhookPayload;

		await db.insert(stravaWebhookLogsTable).values({
			payload: body,
			stravaAthleteId: body.owner_id,
			objectId: body.object_id,
			objectType: body.object_type,
			aspectType: body.aspect_type,
			eventTime: body.event_time
		});

		return new Response('EVENT_RECEIVED', { status: 200 });
	} catch (err) {
		console.error('Webhook Ingest Error:', err);
		// Return 200 even on error to prevent Strava from retrying
		return new Response('EVENT_RECEIVED', { status: 200 });
	}
};
