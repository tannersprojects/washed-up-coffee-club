import { WEBHOOK_OBJECT_TYPE, type WebhookAspectType } from '$lib/constants';
import { db } from '$lib/db';
import { stravaConnectionsTable, type StravaConnection, type StravaWebhookLog } from '$lib/db/schema';
import { refreshConnectionIfNeeded } from '$lib/server/strava/client';
import { eq } from 'drizzle-orm';

export type WebhookValidationResult =
	| { ok: true; connection: StravaConnection; objectId: number; aspectType: WebhookAspectType }
	| { ok: false; skip: true; reason: string }
	| { ok: false; skip: false; reason: string };

/**
 * Two-phase validation:
 * 1. Skip conditions — webhook is valid but irrelevant (non-activity object type)
 * 2. Data integrity + infrastructure — required fields, DB lookup, token refresh
 */
export async function validateWebhookRecord(
	record: StravaWebhookLog
): Promise<WebhookValidationResult> {
	if (record.objectType !== WEBHOOK_OBJECT_TYPE.ACTIVITY) {
		return { ok: false, skip: true, reason: `Skipping non-activity webhook: ${record.objectType}` };
	}

	if (!record.stravaAthleteId) {
		return { ok: false, skip: false, reason: 'Strava athlete ID is required' };
	}

	if (!record.objectId) {
		return { ok: false, skip: false, reason: 'Strava activity ID is required' };
	}

	if (!record.aspectType) {
		return { ok: false, skip: false, reason: 'Aspect type is required' };
	}

	const rawConnection = await db.query.stravaConnectionsTable.findFirst({
		where: eq(stravaConnectionsTable.stravaAthleteId, record.stravaAthleteId)
	});

	if (!rawConnection) {
		return { ok: false, skip: false, reason: 'Strava connection not found' };
	}

	try {
		const connection = await refreshConnectionIfNeeded(rawConnection);
		return { ok: true, connection, objectId: record.objectId, aspectType: record.aspectType };
	} catch (e) {
		const reason = e instanceof Error ? e.message : 'Token refresh failed';
		return { ok: false, skip: false, reason };
	}
}
