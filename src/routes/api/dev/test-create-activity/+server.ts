import fs from 'node:fs/promises';
import path from 'node:path';
import { error, json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { keysToCamel } from '$lib/utils/case';
import { processCreateActivity } from '$lib/server/strava/processors/activity-create-processor';
import type { StravaDetailedActivityCamel } from '$lib/types/strava';
import type { RequestHandler } from './$types';

const DEFAULT_PROFILE_ID = 'd0c2c0e0-1111-4444-8888-000000000008';

const FIXTURE_PATH = path.resolve('docs/example-responses/get-activity-by-id.json');

export const POST: RequestHandler = async ({ url }) => {
	if (!dev) throw error(404, 'Not found');

	const profileId = url.searchParams.get('profileId') ?? DEFAULT_PROFILE_ID;

	const raw = await fs.readFile(FIXTURE_PATH, 'utf-8');
	const activity = keysToCamel<StravaDetailedActivityCamel>(JSON.parse(raw));

	// The seeded Quarter-Mile Burner window is [CURRENT_DATE, CURRENT_DATE + 7],
	// so default the activity's startDate to now to guarantee it falls in range.
	activity.startDate = url.searchParams.get('startDate') ?? new Date().toISOString();

	await processCreateActivity(activity, profileId);

	return json({
		ok: true,
		profileId,
		activityId: activity.id,
		startDate: activity.startDate
	});
};
