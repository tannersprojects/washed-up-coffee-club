import { RUN_SPORT_TYPES, type SportType } from '$lib/constants/strava';
import { CHALLENGE_TYPE, type ChallengeType } from '$lib/constants';
import type { Challenge } from '$lib/db/schema';
import type { StravaDetailedActivityCamel } from '$lib/types/strava';
import type {
	ChallengeActivitySnapshot,
	ChallengeBestEffortsSnapshot,
	ChallengeLapsSnapshot,
	ChallengeSplitsSnapshot
} from '$lib/types/challenge-ranking';

// =============================================================================
// Public types
// =============================================================================

export type ValidationResult =
	| {
			valid: true;
			distance: number;
			movingTime: number;
			elapsedTime: number;
			bestEfforts: ChallengeBestEffortsSnapshot | null;
			splitsMetric: ChallengeSplitsSnapshot | null;
			splitsStandard: ChallengeSplitsSnapshot | null;
			laps: ChallengeLapsSnapshot | null;
			activitySnapshot: ChallengeActivitySnapshot;
	  }
	| { valid: false };

// =============================================================================
// Private — types & shared utilities
// =============================================================================

type ChallengeValidator = (
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
) => ValidationResult;

function getPreferredTime(
	movingTime: number | null | undefined,
	elapsedTime: number | null | undefined
): number | null {
	if (movingTime != null && movingTime > 0) return movingTime;
	if (elapsedTime != null && elapsedTime > 0) return elapsedTime;
	return null;
}

function buildActivitySnapshot(activity: StravaDetailedActivityCamel): ChallengeActivitySnapshot {
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

// =============================================================================
// Private — per-challenge-type validators
// =============================================================================

function validateActivityForBestEffortChallenge(
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

function validateActivityForCumulativeChallenge(
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
		movingTime: getPreferredTime(activity.movingTime, activity.elapsedTime) ?? 0,
		elapsedTime: activity.elapsedTime,
		bestEfforts: activity.bestEfforts ?? null,
		splitsMetric: activity.splitsMetric ?? null,
		splitsStandard: activity.splitsStandard ?? null,
		laps: activity.laps ?? null,
		activitySnapshot: buildActivitySnapshot(activity)
	};
}

function validateActivityForSegmentRaceChallenge(
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
): ValidationResult {
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
}

const CHALLENGE_VALIDATORS: Record<ChallengeType, ChallengeValidator> = {
	[CHALLENGE_TYPE.BEST_EFFORT]: validateActivityForBestEffortChallenge,
	[CHALLENGE_TYPE.CUMULATIVE]: validateActivityForCumulativeChallenge,
	[CHALLENGE_TYPE.SEGMENT_RACE]: validateActivityForSegmentRaceChallenge
};

// =============================================================================
// Public API
// =============================================================================

export function validateActivityForChallenge(
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
): ValidationResult {
	const validator = CHALLENGE_VALIDATORS[challenge.type];
	if (!validator) {
		console.log(`No validator found for challenge type ${challenge.type}`);
		return { valid: false };
	}
	return validator(activity, challenge);
}

/** Returns true if sportType is in RUN_SPORT_TYPES (Run, VirtualRun, TrailRun) */
export function isRunActivity(sportType: SportType): boolean {
	return (RUN_SPORT_TYPES as readonly string[]).includes(sportType);
}
