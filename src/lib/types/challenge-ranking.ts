import type {
	StravaDetailedSegmentEffortCamel,
	StravaLapCamel,
	StravaSplitCamel
} from '$lib/types/strava';

export type ChallengeBestEffortsSnapshot = StravaDetailedSegmentEffortCamel[];
export type ChallengeSplitsSnapshot = StravaSplitCamel[];
export type ChallengeLapsSnapshot = StravaLapCamel[];

export type ChallengeActivitySnapshot = {
	id: number;
	name: string;
	distance: number;
	movingTime: number;
	elapsedTime: number;
	sportType: string;
	startDate: string;
	visibility?: string;
	manual: boolean;
	trainer: boolean;
	averageHeartrate?: number;
	maxHeartrate?: number;
	gearId: string | null;
};
