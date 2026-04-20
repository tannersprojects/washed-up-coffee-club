import { CHALLENGE_TYPE, type ChallengeType } from '$lib/constants';
import type { Challenge } from '$lib/db/schema';
import type { StravaDetailedActivityCamel } from '$lib/types/strava';
import type {
	ChallengeActivitySnapshot,
	ChallengeBestEffortsSnapshot,
	ChallengeLapsSnapshot,
	ChallengeSplitsSnapshot
} from '$lib/types/challenge-ranking';
import { validateActivityForBestEffortChallenge } from './best-effort-validator';
import { validateActivityForCumulativeChallenge } from './cumulative-validator';
import { validateActivityForSegmentRaceChallenge } from './segment-race-validator';

export type ValidationResult =
	| {
			valid: true;
			distance: number;
			movingTime: number | null;
			elapsedTime: number | null;
			bestEfforts: ChallengeBestEffortsSnapshot | null;
			splitsMetric: ChallengeSplitsSnapshot | null;
			splitsStandard: ChallengeSplitsSnapshot | null;
			laps: ChallengeLapsSnapshot | null;
			activitySnapshot: ChallengeActivitySnapshot;
	  }
	| { valid: false };

type ChallengeValidator = (
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
) => ValidationResult;

const CHALLENGE_VALIDATORS = {
	[CHALLENGE_TYPE.BEST_EFFORT]: handleBestEffortValidation,
	[CHALLENGE_TYPE.CUMULATIVE]: handleCumulativeValidation,
	[CHALLENGE_TYPE.SEGMENT_RACE]: handleSegmentRaceValidation
} satisfies Record<ChallengeType, ChallengeValidator>;

export function validateActivityForChallenge(
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
): ValidationResult {
	const validator = CHALLENGE_VALIDATORS[challenge.type];
	return validator(activity, challenge);
}

function handleBestEffortValidation(
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
): ValidationResult {
	console.log(`Validating activity ${activity.id} for best-effort challenge ${challenge.id}`);
	return validateActivityForBestEffortChallenge(activity, challenge);
}

function handleCumulativeValidation(
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
): ValidationResult {
	console.log(`Validating activity ${activity.id} for cumulative challenge ${challenge.id}`);
	return validateActivityForCumulativeChallenge(activity, challenge);
}

function handleSegmentRaceValidation(
	activity: StravaDetailedActivityCamel,
	challenge: Challenge
): ValidationResult {
	console.log(`Validating activity ${activity.id} for segment-race challenge ${challenge.id}`);
	return validateActivityForSegmentRaceChallenge(activity, challenge);
}
