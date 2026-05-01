import type { Challenge } from '$lib/db/schema';
import type { StravaDetailedActivityCamel } from '$lib/types/strava';
import type { ValidationResult } from './activity-validator';
import { buildActivitySnapshot, isRunActivity } from './_shared';

export function validateActivityForCumulativeChallenge(
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
): ValidationResult {
	const isRun = isRunActivity(activity.sportType);

	if (!isRun) {
		console.log(`Activity ${activity.id} is not a run`);
		return { valid: false };
	}

	console.log(`Activity ${activity.id} is valid for challenge ${challenge.id}`);
	console.log(`Activity distance: ${activity.distance}`);
	console.log(`Elapsed time: ${activity.elapsedTime}`);

	return {
		valid: true,
		distance: activity.distance,
		movingTime: activity.movingTime,
		elapsedTime: activity.elapsedTime,
		bestEfforts: activity.bestEfforts ?? null,
		splitsMetric: activity.splitsMetric ?? null,
		splitsStandard: activity.splitsStandard ?? null,
		laps: activity.laps ?? null,
		activitySnapshot: buildActivitySnapshot(activity) // TODO: In the future, should I remove this? Not sure what the purpose is
	};
}
