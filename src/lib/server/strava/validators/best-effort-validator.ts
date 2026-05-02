import type { Challenge } from '$lib/db/schema';
import type { StravaDetailedActivityCamel } from '$lib/types/strava';
import type { ValidationResult } from './activity-validator';
import { buildActivitySnapshot, isRunActivity } from './_shared';

export function validateActivityForBestEffortChallenge(
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
): ValidationResult {
	const goalDistance = challenge.goalDistance ?? 0;
	const isRun = isRunActivity(activity.sportType);

	if (!isRun) {
		return { valid: false };
	}

	if (activity.distance < goalDistance) {
		return { valid: false };
	}

	return {
		valid: true,
		distance: activity.distance,
		movingTime: activity.movingTime,
		elapsedTime: activity.elapsedTime,
		bestEfforts: activity.bestEfforts ?? null,
		splitsMetric: activity.splitsMetric ?? null,
		splitsStandard: activity.splitsStandard ?? null,
		laps: activity.laps ?? null,
		activitySnapshot: buildActivitySnapshot(activity)
	};
}
