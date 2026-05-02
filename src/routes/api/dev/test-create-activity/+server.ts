import fs from 'node:fs/promises';
import path from 'node:path';
import { error, json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import {
	RANKING_METRIC,
	RANKING_METRIC_BEST_EFFORT_NAME,
	RANKING_METRIC_DISTANCES
} from '$lib/constants';
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
	bestEffortsMode?: BestEffortsMode;
	halfMarathonEffortTimeSeconds?: number;
	halfMarathonEffortSource?: EffortTimeSource;
	cascadeStrategy?: CascadeStrategy;
	rounding?: CascadeRounding;
	overrides?: ActivityOverrides;
};

type BestEffortsMode = 'fixture' | 'none' | 'injectHalfMarathonCascade' | 'stripHalfMarathon';
type EffortTimeSource = 'moving' | 'elapsed';
type CascadeStrategy = 'vdotDefault' | 'riegel';
type CascadeRounding = 'nearestSecond' | 'floor';

const ALLOWED_TOP_LEVEL_KEYS = new Set([
	'profileId',
	'startDate',
	'bestEffortsMode',
	'halfMarathonEffortTimeSeconds',
	'halfMarathonEffortSource',
	'cascadeStrategy',
	'rounding',
	'overrides'
]);
const ALLOWED_OVERRIDE_KEYS = new Set([
	'id',
	'name',
	'distance',
	'movingTime',
	'elapsedTime',
	'sportType',
	'bestEfforts'
]);
const BEST_EFFORTS_MODE_VALUES = new Set<BestEffortsMode>([
	'fixture',
	'none',
	'injectHalfMarathonCascade',
	'stripHalfMarathon'
]);
const EFFORT_TIME_SOURCE_VALUES = new Set<EffortTimeSource>(['moving', 'elapsed']);
const CASCADE_STRATEGY_VALUES = new Set<CascadeStrategy>(['vdotDefault', 'riegel']);
const CASCADE_ROUNDING_VALUES = new Set<CascadeRounding>(['nearestSecond', 'floor']);
const HM_CASCADE_METRICS = [
	RANKING_METRIC.STANDARD_400M,
	RANKING_METRIC.STANDARD_800M,
	RANKING_METRIC.STANDARD_1K,
	RANKING_METRIC.STANDARD_1_MILE,
	RANKING_METRIC.STANDARD_2_MILE,
	RANKING_METRIC.STANDARD_5K,
	RANKING_METRIC.STANDARD_10K,
	RANKING_METRIC.STANDARD_15K,
	RANKING_METRIC.STANDARD_10_MILE,
	RANKING_METRIC.STANDARD_20K,
	RANKING_METRIC.STANDARD_HALF_MARATHON
] as const;
const HM_METERS = RANKING_METRIC_DISTANCES[RANKING_METRIC.STANDARD_HALF_MARATHON] ?? 21097;
const HM_DISTANCE_TOLERANCE_RATIO = 0.01;

export const POST: RequestHandler = async ({ locals: { logger }, request }) => {
	if (!dev) throw error(404, 'Not found');

	const body = await parseBody(request);
	validateBody(body);
	const overrides = body.overrides ?? {};
	validateOverrides(overrides);
	const bestEffortsMode = body.bestEffortsMode ?? 'fixture';
	const halfMarathonEffortSource = body.halfMarathonEffortSource ?? 'moving';
	const cascadeStrategy = body.cascadeStrategy ?? 'vdotDefault';
	const rounding = body.rounding ?? 'nearestSecond';

	const profileId = body.profileId ?? DEFAULT_PROFILE_ID;
	const resolvedStartDate = body.startDate ?? new Date().toISOString();

	const raw = await fs.readFile(FIXTURE_PATH, 'utf-8');
	const activity = keysToCamel<StravaDetailedActivityCamel>(JSON.parse(raw));
	applyOverrides(activity, overrides);
	applyBestEffortsMode(activity, bestEffortsMode, {
		halfMarathonEffortTimeSeconds: body.halfMarathonEffortTimeSeconds,
		halfMarathonEffortSource,
		cascadeStrategy,
		rounding
	});

	// The seeded Quarter-Mile Burner window is [CURRENT_DATE, CURRENT_DATE + 7],
	// so default the activity's startDate to now to guarantee it falls in range.
	activity.startDate = resolvedStartDate;

	await processCreateActivity(activity, profileId, undefined, logger);

	return json({
		ok: true,
		profileId,
		activityId: activity.id,
		startDate: activity.startDate,
		bestEffortsMode,
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
	const parsedBody = body as Partial<TestCreateActivityBody>;

	if (
		parsedBody.profileId != null &&
		(typeof parsedBody.profileId !== 'string' || !parsedBody.profileId.trim())
	) {
		throw error(400, 'profileId must be a non-empty string');
	}

	if (parsedBody.startDate != null) {
		if (typeof parsedBody.startDate !== 'string') {
			throw error(400, 'startDate must be an ISO date string');
		}
		const timestamp = Date.parse(parsedBody.startDate);
		if (!Number.isFinite(timestamp)) {
			throw error(400, 'startDate must be a valid ISO date string');
		}
	}

	if (parsedBody.overrides != null && !isPlainObject(parsedBody.overrides)) {
		throw error(400, 'overrides must be an object');
	}

	if (
		parsedBody.bestEffortsMode != null &&
		!BEST_EFFORTS_MODE_VALUES.has(parsedBody.bestEffortsMode)
	) {
		throw error(
			400,
			'bestEffortsMode must be fixture, none, stripHalfMarathon, or injectHalfMarathonCascade'
		);
	}
	if (
		parsedBody.halfMarathonEffortSource != null &&
		!EFFORT_TIME_SOURCE_VALUES.has(parsedBody.halfMarathonEffortSource)
	) {
		throw error(400, 'halfMarathonEffortSource must be moving or elapsed');
	}
	if (
		parsedBody.cascadeStrategy != null &&
		!CASCADE_STRATEGY_VALUES.has(parsedBody.cascadeStrategy)
	) {
		throw error(400, 'cascadeStrategy must be vdotDefault or riegel');
	}
	if (parsedBody.rounding != null && !CASCADE_ROUNDING_VALUES.has(parsedBody.rounding)) {
		throw error(400, 'rounding must be nearestSecond or floor');
	}
	if (
		parsedBody.bestEffortsMode === 'injectHalfMarathonCascade' &&
		(parsedBody.halfMarathonEffortTimeSeconds == null ||
			!Number.isInteger(parsedBody.halfMarathonEffortTimeSeconds) ||
			parsedBody.halfMarathonEffortTimeSeconds <= 0)
	) {
		throw error(
			400,
			'halfMarathonEffortTimeSeconds must be a positive integer when injectHalfMarathonCascade is used'
		);
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

function applyBestEffortsMode(
	activity: StravaDetailedActivityCamel,
	mode: BestEffortsMode,
	options: {
		halfMarathonEffortTimeSeconds?: number;
		halfMarathonEffortSource: EffortTimeSource;
		cascadeStrategy: CascadeStrategy;
		rounding: CascadeRounding;
	}
): void {
	if (mode === 'fixture') return;
	if (mode === 'none') {
		activity.bestEfforts = undefined;
		return;
	}

	const existingEfforts = activity.bestEfforts ?? [];
	if (mode === 'stripHalfMarathon') {
		activity.bestEfforts = existingEfforts.filter((effort) => !isHalfMarathonEffort(effort));
		return;
	}

	if (mode === 'injectHalfMarathonCascade') {
		const seconds = options.halfMarathonEffortTimeSeconds;
		if (seconds == null || seconds <= 0) return;

		const generatedEfforts = buildHalfMarathonCascadeEfforts(
			seconds,
			options.cascadeStrategy,
			options.rounding,
			options.halfMarathonEffortSource,
			existingEfforts[0]
		);
		activity.bestEfforts = replaceLowerAndHalfMarathonEfforts(existingEfforts, generatedEfforts);
	}
}

function replaceLowerAndHalfMarathonEfforts(
	existingEfforts: NonNullable<StravaDetailedActivityCamel['bestEfforts']>,
	generatedEfforts: NonNullable<StravaDetailedActivityCamel['bestEfforts']>
): NonNullable<StravaDetailedActivityCamel['bestEfforts']> {
	return [
		...existingEfforts.filter((effort) => !isHalfMarathonOrLowerEffort(effort)),
		...generatedEfforts
	];
}

function isHalfMarathonOrLowerEffort(
	effort: NonNullable<StravaDetailedActivityCamel['bestEfforts']>[number]
): boolean {
	const distance = effort.distance ?? null;
	if (distance == null || distance <= 0) return false;
	return distance <= HM_METERS * (1 + HM_DISTANCE_TOLERANCE_RATIO);
}

function isHalfMarathonEffort(
	effort: NonNullable<StravaDetailedActivityCamel['bestEfforts']>[number]
): boolean {
	const distance = effort.distance ?? null;
	const name = effort.name ?? '';
	const byName = name.toLowerCase() === 'half-marathon'.toLowerCase();
	const byDistance =
		distance != null && Math.abs(distance - HM_METERS) / HM_METERS <= HM_DISTANCE_TOLERANCE_RATIO;
	return byName || byDistance;
}

function buildHalfMarathonCascadeEfforts(
	halfMarathonEffortTimeSeconds: number,
	strategy: CascadeStrategy,
	rounding: CascadeRounding,
	source: EffortTimeSource,
	template: NonNullable<StravaDetailedActivityCamel['bestEfforts']>[number] | undefined
): NonNullable<StravaDetailedActivityCamel['bestEfforts']> {
	return HM_CASCADE_METRICS.map((metric, idx) => {
		const distance = RANKING_METRIC_DISTANCES[metric] ?? HM_METERS;
		const name = RANKING_METRIC_BEST_EFFORT_NAME[metric] ?? `${distance}m`;
		const seconds = deriveCascadeTimeSeconds(
			halfMarathonEffortTimeSeconds,
			HM_METERS,
			distance,
			strategy,
			rounding
		);
		return buildInjectedBestEffort(name, distance, seconds, source, template, idx);
	});
}

function deriveCascadeTimeSeconds(
	halfMarathonEffortTimeSeconds: number,
	halfMarathonDistance: number,
	targetDistance: number,
	strategy: CascadeStrategy,
	rounding: CascadeRounding
): number {
	const ratio = targetDistance / halfMarathonDistance;
	const exponent = strategy === 'riegel' ? 1.06 : 1.07;
	const raw = halfMarathonEffortTimeSeconds * Math.pow(ratio, exponent);
	return applyRounding(raw, rounding);
}

function applyRounding(value: number, rounding: CascadeRounding): number {
	if (rounding === 'floor') return Math.max(1, Math.floor(value));
	return Math.max(1, Math.round(value));
}

function buildInjectedBestEffort(
	name: string,
	distance: number,
	seconds: number,
	source: EffortTimeSource,
	template: NonNullable<StravaDetailedActivityCamel['bestEfforts']>[number] | undefined,
	seedOffset: number
): NonNullable<StravaDetailedActivityCamel['bestEfforts']>[number] {
	const fallbackId = 9_000_000_000 + seedOffset;
	const base =
		template ??
		({
			id: fallbackId,
			resourceState: 2,
			name,
			activity: { id: fallbackId, resourceState: 1 },
			athlete: { id: 0, resourceState: 1 },
			elapsedTime: seconds,
			movingTime: seconds,
			startDate: new Date().toISOString(),
			startDateLocal: new Date().toISOString(),
			distance,
			startIndex: 0,
			endIndex: 0,
			segment: {
				id: fallbackId,
				resourceState: 2,
				name,
				activityType: 'Run',
				distance,
				averageGrade: 0,
				maximumGrade: 0,
				elevationHigh: 0,
				elevationLow: 0,
				startLatlng: [],
				endLatlng: [],
				climbCategory: 0,
				city: '',
				state: '',
				country: '',
				private: false,
				hazardous: false,
				starred: false
			},
			prRank: null,
			achievements: [],
			komRank: null,
			hidden: false
		} as unknown as NonNullable<StravaDetailedActivityCamel['bestEfforts']>[number]);

	return {
		...base,
		id: base.id + seedOffset + 1,
		name,
		distance,
		movingTime: source === 'moving' ? seconds : base.movingTime,
		elapsedTime: source === 'elapsed' ? seconds : base.elapsedTime
	};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value != null && !Array.isArray(value);
}
