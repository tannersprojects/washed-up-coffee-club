import type { ChallengeStatus } from '$lib/constants';

export type ChallengeTimeState = {
	status: ChallengeStatus;
	targetDate: Date;
	label: string;
};
