import { RUN_SPORT_TYPES, type SportType } from '$lib/constants/strava';
import type { StravaDetailedActivityCamel } from '$lib/types/strava';
import type { ChallengeActivitySnapshot } from '$lib/types/challenge-ranking';

export function getPreferredTime(
	movingTime: number | null | undefined,
	elapsedTime: number | null | undefined
): number | null {
	if (movingTime != null && movingTime > 0) return movingTime;
	if (elapsedTime != null && elapsedTime > 0) return elapsedTime;
	return null;
}

/** Returns true if sportType is in RUN_SPORT_TYPES (Run, VirtualRun, TrailRun) */
export function isRunActivity(sportType: SportType): boolean {
	return (RUN_SPORT_TYPES as readonly string[]).includes(sportType);
}

export function buildActivitySnapshot(
	activity: StravaDetailedActivityCamel
): ChallengeActivitySnapshot {
	return {
		id: activity.id,
		name: activity.name,
		distance: activity.distance,
		movingTime: activity.movingTime,
		elapsedTime: activity.elapsedTime,
		sportType: activity.sportType,
		startDate: activity.startDate,
		visibility: activity.visibility,
		manual: activity.manual,
		trainer: activity.trainer,
		averageHeartrate: activity.averageHeartrate,
		maxHeartrate: activity.maxHeartrate,
		gearId: activity.gearId
	};
}
