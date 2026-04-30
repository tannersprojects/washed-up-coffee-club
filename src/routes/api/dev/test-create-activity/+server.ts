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

type ActivityOverrides = {
	id?: number;
	name?: string;
	distance?: number | null;
	movingTime?: number | null;
	elapsedTime?: number | null;
	sportType?: StravaDetailedActivityCamel['sportType'];
	bestEfforts?: StravaDetailedActivityCamel['bestEfforts'] | null;
};

type TestCreateActivityBody = {
	profileId?: string;
	startDate?: string;
	overrides?: ActivityOverrides;
};

const ALLOWED_TOP_LEVEL_KEYS = new Set(['profileId', 'startDate', 'overrides']);
const ALLOWED_OVERRIDE_KEYS = new Set([
	'id',
	'name',
	'distance',
	'movingTime',
	'elapsedTime',
	'sportType',
	'bestEfforts'
]);

export const POST: RequestHandler = async ({ request }) => {
	if (!dev) throw error(404, 'Not found');

	const body = await parseBody(request);
	validateBody(body);
	const overrides = body.overrides ?? {};
	validateOverrides(overrides);

	const profileId = body.profileId ?? DEFAULT_PROFILE_ID;
	const resolvedStartDate = new Date().toISOString();

	const raw = await fs.readFile(FIXTURE_PATH, 'utf-8');
	const activity = keysToCamel<StravaDetailedActivityCamel>(JSON.parse(raw));
	applyOverrides(activity, overrides);

	// The seeded Quarter-Mile Burner window is [CURRENT_DATE, CURRENT_DATE + 7],
	// so default the activity's startDate to now to guarantee it falls in range.
	activity.startDate = resolvedStartDate;

	await processCreateActivity(activity, profileId);

	return json({
		ok: true,
		profileId,
		activityId: activity.id,
		startDate: activity.startDate,
		appliedOverrides: overrides
	});
};

function parseBody(request: Request): Promise<unknown> {
	const contentType = request.headers.get('content-type') ?? '';
	if (!contentType.toLowerCase().includes('application/json')) {
		throw error(400, 'Content-Type must be application/json');
	}

	return request
		.json()
		.catch(() => {
			throw error(400, 'Request body must be valid JSON');
		})
		.then((body) => {
			if (
				body == null ||
				(typeof body === 'object' && !Array.isArray(body) && !Object.keys(body).length)
			) {
				throw error(400, 'Request body is required');
			}

			return body;
		});
}

function validateBody(body: unknown): asserts body is TestCreateActivityBody {
	if (!isPlainObject(body)) {
		throw error(400, 'Request body must be a JSON object');
	}

	for (const key of Object.keys(body)) {
		if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
			throw error(400, `Unexpected request body field: ${key}`);
		}
	}

	if (body.profileId != null && (typeof body.profileId !== 'string' || !body.profileId.trim())) {
		throw error(400, 'profileId must be a non-empty string');
	}

	if (body.startDate != null) {
		if (typeof body.startDate !== 'string') {
			throw error(400, 'startDate must be an ISO date string');
		}
		const timestamp = Date.parse(body.startDate);
		if (!Number.isFinite(timestamp)) {
			throw error(400, 'startDate must be a valid ISO date string');
		}
	}

	if (body.overrides != null && !isPlainObject(body.overrides)) {
		throw error(400, 'overrides must be an object');
	}
}

function validateOverrides(overrides: ActivityOverrides): void {
	for (const key of Object.keys(overrides)) {
		if (!ALLOWED_OVERRIDE_KEYS.has(key)) {
			throw error(400, `Unexpected overrides field: ${key}`);
		}
	}

	if (overrides.id != null && (!Number.isInteger(overrides.id) || overrides.id <= 0)) {
		throw error(400, 'overrides.id must be a positive integer');
	}
	if (overrides.name != null && typeof overrides.name !== 'string') {
		throw error(400, 'overrides.name must be a string');
	}
	if (
		overrides.distance != null &&
		(typeof overrides.distance !== 'number' || overrides.distance < 0)
	) {
		throw error(400, 'overrides.distance must be null or a non-negative number');
	}
	if (
		overrides.movingTime != null &&
		(!Number.isInteger(overrides.movingTime) || overrides.movingTime < 0)
	) {
		throw error(400, 'overrides.movingTime must be null or a non-negative integer');
	}
	if (
		overrides.elapsedTime != null &&
		(!Number.isInteger(overrides.elapsedTime) || overrides.elapsedTime < 0)
	) {
		throw error(400, 'overrides.elapsedTime must be null or a non-negative integer');
	}
	if (overrides.sportType != null && typeof overrides.sportType !== 'string') {
		throw error(400, 'overrides.sportType must be a string');
	}
	if (overrides.bestEfforts != null && !Array.isArray(overrides.bestEfforts)) {
		throw error(400, 'overrides.bestEfforts must be null or an array');
	}
}

function applyOverrides(activity: StravaDetailedActivityCamel, overrides: ActivityOverrides): void {
	if (overrides.id !== undefined) activity.id = overrides.id;
	if (overrides.name !== undefined) activity.name = overrides.name;
	if (overrides.distance !== undefined && overrides.distance !== null)
		activity.distance = overrides.distance;
	if (overrides.movingTime !== undefined && overrides.movingTime !== null) {
		activity.movingTime = overrides.movingTime;
	}
	if (overrides.elapsedTime !== undefined && overrides.elapsedTime !== null) {
		activity.elapsedTime = overrides.elapsedTime;
	}
	if (overrides.sportType !== undefined) activity.sportType = overrides.sportType;
	if (overrides.bestEfforts !== undefined) {
		activity.bestEfforts = overrides.bestEfforts === null ? undefined : overrides.bestEfforts;
	}
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value != null && !Array.isArray(value);
}
