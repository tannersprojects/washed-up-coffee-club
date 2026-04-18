import type { Challenge } from '$lib/db/schema';
import type { StravaDetailedActivityCamel } from '$lib/types/strava';
import type { ValidationResult } from './activity-validator';
import { buildActivitySnapshot, getPreferredTime, isRunActivity } from './_shared';

export function validateActivityForBestEffortChallenge(
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
): ValidationResult {
	const goalDistance = challenge.goalDistance ?? 0;
	const isRun = isRunActivity(activity.sportType);

	if (!isRun) {
		console.log(`Activity ${activity.id} is not a run`);
		return { valid: false };
	}

	if (activity.distance < goalDistance) {
		console.log(
			`Activity ${activity.id} is less than the goal distance ${activity.distance} < ${goalDistance}`
		);
		return { valid: false };
	}

	console.log(`Activity ${activity.id} is valid for challenge ${challenge.id}`);
	return {
		valid: true,
		distance: activity.distance,
		movingTime: getPreferredTime(activity.movingTime, activity.elapsedTime) ?? 0,
		elapsedTime: activity.elapsedTime,
		bestEfforts: activity.bestEfforts ?? null,
		splitsMetric: activity.splitsMetric ?? null,
		splitsStandard: activity.splitsStandard ?? null,
		laps: activity.laps ?? null,
		activitySnapshot: buildActivitySnapshot(activity)
	};
}
