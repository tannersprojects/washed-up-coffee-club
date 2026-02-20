import { RUN_SPORT_TYPES, type SportType } from '$lib/constants/strava';
import { CHALLENGE_TYPE, type ChallengeType } from '$lib/constants';
import type { Challenge } from '$lib/db/schema';
import type { StravaDetailedActivityCamel } from '$lib/types/strava';

export type ValidationResult = { valid: true; distance: number; time: number } | { valid: false };

type ChallengeValidator = (
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
) => ValidationResult;

/** Returns true if sportType is in RUN_SPORT_TYPES (Run, VirtualRun, TrailRun) */
export function isRunActivity(sportType: SportType): boolean {
	return (RUN_SPORT_TYPES as readonly string[]).includes(sportType);
}

function validateActivityForBestEffortChallenge(
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
): ValidationResult {
	const goalValue = challenge.goalValue ?? 0;
	const isRun = isRunActivity(activity.sportType);

	if (!isRun) {
		console.log(`Activity ${activity.id} is not a run`);
		return { valid: false };
	}

	if (activity.distance < goalValue) {
		console.log(
			`Activity ${activity.id} is less than the goal value ${activity.distance} < ${goalValue}`
		);
		return { valid: false };
	}

	console.log(`Activity ${activity.id} is valid for challenge ${challenge.id}`);
	return { valid: true, distance: activity.distance, time: activity.elapsedTime };
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

	return { valid: true, distance: activity.distance, time: activity.elapsedTime };
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

	const effort = activity.segmentEfforts?.find((e) => e.segment?.id === challenge.segmentId);
	if (!effort) {
		console.log(`Activity ${activity.id} has no segment effort`);
		return { valid: false };
	}

	return {
		valid: true,
		distance: effort.distance,
		time: effort.elapsedTime
	};
}

const CHALLENGE_VALIDATORS: Record<ChallengeType, ChallengeValidator> = {
	[CHALLENGE_TYPE.BEST_EFFORT]: validateActivityForBestEffortChallenge,
	[CHALLENGE_TYPE.CUMULATIVE]: validateActivityForCumulativeChallenge,
	[CHALLENGE_TYPE.SEGMENT_RACE]: validateActivityForSegmentRaceChallenge
};

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
