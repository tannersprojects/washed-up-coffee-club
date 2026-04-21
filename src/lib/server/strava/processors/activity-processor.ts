import { WEBHOOK_ASPECT_TYPE, type WebhookAspectType } from '$lib/constants/strava';
import type { StravaConnection } from '$lib/db/schema';
import { getActivityById } from '../client';
import { processCreateActivity } from './activity-create-processor';
import { processDeleteActivity } from './activity-delete-processor';
import { processUpdateActivity } from './activity-update-processor';

type ActivityHandler = (activityId: number, connection: StravaConnection) => Promise<void>;

const ACTIVITY_HANDLERS = {
	[WEBHOOK_ASPECT_TYPE.CREATE]: handleCreateActivity,
	[WEBHOOK_ASPECT_TYPE.UPDATE]: handleUpdateActivity,
	[WEBHOOK_ASPECT_TYPE.DELETE]: handleDeleteActivity
} satisfies Record<WebhookAspectType, ActivityHandler>;

export async function processActivity(
	aspectType: WebhookAspectType,
	activityId: number,
	connection: StravaConnection
): Promise<void> {
	const handler = ACTIVITY_HANDLERS[aspectType];
	await handler(activityId, connection);
}

async function handleCreateActivity(
	activityId: number,
	connection: StravaConnection
): Promise<void> {
	const activity = await getActivityById(activityId, true, connection.accessToken);
	console.log(`Processing CREATE for activity ${activity.id} on profile ${connection.profileId}`);
	await processCreateActivity(activity, connection.profileId);
}

async function handleUpdateActivity(
	activityId: number,
	_connection: StravaConnection
): Promise<void> {
	console.log(`UPDATE for activity ${activityId} — not yet implemented`);
	await processUpdateActivity();
}

async function handleDeleteActivity(
	activityId: number,
	_connection: StravaConnection
): Promise<void> {
	console.log(`DELETE for activity ${activityId} — not yet implemented`);
	await processDeleteActivity();
}
