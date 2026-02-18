import { eq } from 'drizzle-orm';
import { db } from '@shared/db.ts';
import { stravaWebhookLogsTable } from '@shared/schema.ts';

Deno.serve(async (req) => {
	try {
		// TODO: Validate authorization - create custom auth header
		const { record } = await req.json();

		if (!record) {
			console.error('Bad Request: missing record');
			return new Response('Bad Request: missing record', { status: 400 });
		}

		console.log(
			`Processing webhook log ${record.id}: ${record.object_type} ${record.aspect_type} for athlete ${record.strava_athlete_id}`
		);

		// Only process activity creation events
		if (record.object_type !== 'activity' || record.aspect_type !== 'create') {
			console.log(
				`Skipping non-create-activity event: ${record.object_type}/${record.aspect_type}`
			);
			await updateLogStatus(record.id, 'processed');
			return new Response(JSON.stringify({ status: 'skipped' }), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// TODO: Implement full processing logic (see docs/strava_webhook_future_work.md)
		// 1. Look up athlete's Strava connection via strava_athlete_id
		// 2. Refresh token if expired
		// 3. Fetch full activity details from Strava API: GET /api/v3/activities/{object_id}
		// 4. Check for active challenges the athlete is participating in
		// 5. Validate activity against challenge criteria (type, distance, date range)
		// 6. Create challenge_contribution record if criteria met
		// 7. Update challenge_participant.result_value / result_display

		await updateLogStatus(record.id, 'processed');

		return new Response(JSON.stringify({ status: 'processed' }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('Edge Function Error:', err);

		return new Response(JSON.stringify({ error: 'Internal error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
});

async function updateLogStatus(
	logId: string,
	status: 'processed' | 'error',
	errorMessage?: string
) {
	await db
		.update(stravaWebhookLogsTable)
		.set({
			status,
			...(errorMessage && { errorMessage })
		})
		.where(eq(stravaWebhookLogsTable.id, logId));
}
