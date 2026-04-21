// TODO(segment-race): Not functional yet. Returns { valid: false } for all inputs.
// Disabled reference implementation preserved below for the segment-race enablement work.

import type { Challenge } from '$lib/db/schema';
import type { StravaDetailedActivityCamel } from '$lib/types/strava';
import type { ValidationResult } from './activity-validator';

export function validateActivityForSegmentRaceChallenge(
	_activity: StravaDetailedActivityCamel,
	_challenge: Challenge
): ValidationResult {
	// TODO: Segment race validation not supported — webhook pipeline must not count activities
	// until segment flow is implemented. Previous implementation kept below for reference.
	return { valid: false };

	/* Previous implementation (disabled):
	const isRun = isRunActivity(activity.sportType);

	if (!isRun) {
		console.log(`Activity ${activity.id} is not a run`);
		return { valid: false };
	}

	if (!challenge.segmentId) {
		console.log(`Challenge ${challenge.id} has no segment ID`);
		return { valid: false };
	}

	const matchingEfforts =
		activity.segmentEfforts?.filter((e) => e.segment?.id === challenge.segmentId) ?? [];
	if (matchingEfforts.length === 0) {
		console.log(`Activity ${activity.id} has no segment effort`);
		return { valid: false };
	}

	const effort = matchingEfforts.reduce((best, current) =>
		(getPreferredTime(current.movingTime, current.elapsedTime) ?? Infinity) <
		(getPreferredTime(best.movingTime, best.elapsedTime) ?? Infinity)
			? current
			: best
	);
	const bestEffortMovingTime = getPreferredTime(effort.movingTime, effort.elapsedTime);
	if (bestEffortMovingTime == null || bestEffortMovingTime <= 0) {
		return { valid: false };
	}

	return {
		valid: true,
		distance: effort.distance,
		movingTime: bestEffortMovingTime,
		elapsedTime: effort.elapsedTime,
		bestEfforts: activity.bestEfforts ?? null,
		splitsMetric: activity.splitsMetric ?? null,
		splitsStandard: activity.splitsStandard ?? null,
		laps: activity.laps ?? null,
		activitySnapshot: buildActivitySnapshot(activity)
	};
	*/
}
