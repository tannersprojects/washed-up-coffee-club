import type { Challenge } from '$lib/db/schema';
import type { StravaDetailedActivityCamel } from '$lib/types/strava';
import type { ValidationResult } from './activity-validator';
import { buildActivitySnapshot, isRunActivity } from './_shared';

export function validateActivityForCumulativeChallenge(
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
): ValidationResult {
	void challenge;
	const isRun = isRunActivity(activity.sportType);

	if (!isRun) {
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
		activitySnapshot: buildActivitySnapshot(activity) // TODO: In the future, should I remove this? Not sure what the purpose is
	};
}
