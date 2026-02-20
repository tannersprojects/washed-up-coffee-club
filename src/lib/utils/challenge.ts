import type { ChallengeParticipantWithRelations } from '$lib/types/dashboard.js';
import type { ChallengeTimeState } from '$lib/types/challenge.js';
import {
	CHALLENGE_STATUS,
	CHALLENGE_JOIN_DISPLAY_STATE,
	COUNTDOWN_LABEL,
	type ChallengeJoinDisplayState
} from '$lib/constants';
import type { Challenge } from '$lib/db/schema';
import type { ChallengeUI } from '../../routes/(app)/dashboard/_logic/ChallengeUI.svelte';

export function calculateTotalDistanceKm(
	challengeParticipantsWithRelations: ChallengeParticipantWithRelations[],
	goalValueMeters: number | null
): string {
	if (!goalValueMeters) {
		return '0.0';
	}

	const totalKm = challengeParticipantsWithRelations.reduce((acc, participant) => {
		if (participant.status === 'completed' && goalValueMeters) {
			return acc + goalValueMeters / 1000;
		}
		// If they are in progress, we ideally use their current progress,
		// but for now we only have the completed goal value in the logic.
		return acc;
	}, 0);

	return totalKm.toFixed(1);
}

export function getChallengeTimeStateFromDates(
	startDate: Date | string,
	endDate: Date | string
): ChallengeTimeState {
	const now = new Date();
	const start = new Date(startDate);
	const end = new Date(endDate);

	if (now < start) {
		return {
			status: CHALLENGE_STATUS.UPCOMING,
			targetDate: start,
			label: COUNTDOWN_LABEL.TIME_UNTIL
		};
	}
	if (now < end) {
		return {
			status: CHALLENGE_STATUS.ACTIVE,
			targetDate: end,
			label: COUNTDOWN_LABEL.TIME_REMAINING
		};
	}
	return {
		status: CHALLENGE_STATUS.COMPLETED,
		targetDate: end,
		label: COUNTDOWN_LABEL.TIME_REMAINING
	};
}

export function isChallengeJoinable(challenge: ChallengeUI | Challenge | null): boolean {
	if (!challenge || !challenge.isActive) {
		return false;
	}

	const now = new Date();
	const endDate = new Date(challenge.endDate);
	if (now >= endDate) {
		return false;
	}

	return true;
}

export function getChallengeJoinDisplayState(challenge: ChallengeUI): ChallengeJoinDisplayState {
	if (challenge.isParticipating) {
		return CHALLENGE_JOIN_DISPLAY_STATE.PARTICIPATING;
	}

	const timeState = getChallengeTimeStateFromDates(challenge.startDate, challenge.endDate);

	if (timeState.status === CHALLENGE_STATUS.COMPLETED) {
		return CHALLENGE_JOIN_DISPLAY_STATE.ENDED;
	}
	if (
		timeState.status === CHALLENGE_STATUS.ACTIVE ||
		timeState.status === CHALLENGE_STATUS.UPCOMING
	) {
		return CHALLENGE_JOIN_DISPLAY_STATE.JOINABLE;
	}

	return CHALLENGE_JOIN_DISPLAY_STATE.NOT_ACTIVE;
}

/** Format seconds as H:MM:SS */
export function formatTime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	if (h > 0) {
		return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}
	return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format meters as "X.X km" or "Mile N" for round miles */
export function formatDistance(meters: number): string {
	const km = meters / 1000;
	const miles = meters / 1609.344;
	if (miles >= 1 && Math.abs(miles - Math.round(miles)) < 0.01) {
		return `Mile ${Math.round(miles)}`;
	}
	return `${km.toFixed(1)} km`;
}

/** Format result for display. Always shows time when resultTime is set; otherwise "--". */
export function formatResultDisplay(resultTime: number | null): string {
	if (resultTime != null) {
		return formatTime(resultTime);
	}
	return '--';
}
