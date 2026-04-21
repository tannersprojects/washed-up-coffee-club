import type { ChallengeParticipantWithRelations } from '$lib/types/dashboard.js';
import type { ChallengeTimeState } from '$lib/types/challenge.js';
import {
	CHALLENGE_STATUS,
	CHALLENGE_STATUS_BADGE,
	COUNTDOWN_LABEL,
	DISTANCE_UNIT,
	PACE_UNIT_LABEL,
	PARTICIPANT_STATUS,
	type ChallengeStatus,
	type ChallengeStatusBadge,
	type DistanceUnit
} from '$lib/constants';
import { metersToKm, metersToMiles } from '$lib/utils/distance.js';

export type ChallengeWithDates = {
	isActive?: boolean;
	endDate: Date | string;
};

/** Sums goalDistanceMeters per completed participant (total "distance completed" for display). */
export function calculateTotalDistance(
	challengeParticipantsWithRelations: ChallengeParticipantWithRelations[],
	goalDistanceMeters: number | null,
	unit: DistanceUnit
): string {
	if (!goalDistanceMeters) {
		return unit === DISTANCE_UNIT.MILES ? '0.0 mi' : '0.0 km';
	}

	const totalMeters = challengeParticipantsWithRelations.reduce((acc, participant) => {
		if (participant.status === PARTICIPANT_STATUS.COMPLETED && goalDistanceMeters) {
			return acc + goalDistanceMeters;
		}
		return acc;
	}, 0);

	if (unit === DISTANCE_UNIT.MILES) {
		const miles = metersToMiles(totalMeters);
		return `${miles.toFixed(1)} mi`;
	}
	const km = metersToKm(totalMeters);
	return `${km.toFixed(1)} km`;
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

export function isChallengeJoinable(challenge: ChallengeWithDates | null): boolean {
	if (!challenge || !challenge.isActive) return false;
	const now = new Date();
	const endDate = new Date(challenge.endDate);
	return now < endDate;
}

/** Returns Tailwind class for challenge status dot (active=green, upcoming=yellow, completed=gray). */
export function getChallengeStatusColor(status: ChallengeStatus | string): string {
	switch (status) {
		case CHALLENGE_STATUS.ACTIVE:
			return 'bg-(--accent-lime)';
		case CHALLENGE_STATUS.UPCOMING:
			return 'bg-yellow-500';
		case CHALLENGE_STATUS.COMPLETED:
			return 'bg-(--grey-olive)';
		default:
			return 'bg-(--grey-olive)';
	}
}

/** Returns display label for challenge status badge. */
export function getChallengeStatusBadgeLabel(status: ChallengeStatus | string): string {
	switch (status) {
		case CHALLENGE_STATUS.UPCOMING:
			return 'Upcoming Challenge';
		case CHALLENGE_STATUS.ACTIVE:
			return 'Active Challenge';
		case CHALLENGE_STATUS.COMPLETED:
			return 'Challenge Ended';
		default:
			return 'Challenge Ended';
	}
}

/** Returns Tailwind classes for challenge status badge (border, bg, text). */
export function getChallengeStatusBadgeClasses(status: ChallengeStatus | string): string {
	switch (status) {
		case CHALLENGE_STATUS.ACTIVE:
			return 'border-(--accent-lime)/40 bg-(--accent-lime)/5 text-(--accent-lime)';
		case CHALLENGE_STATUS.UPCOMING:
			return 'border-yellow-500/40 bg-yellow-500/5 text-yellow-500';
		case CHALLENGE_STATUS.COMPLETED:
			return 'border-(--grey-olive)/40 bg-(--grey-olive)/5 text-(--grey-olive)';
		default:
			return 'border-(--grey-olive)/40 bg-(--grey-olive)/5 text-(--grey-olive)';
	}
}

export function isChallengeActiveOrUpcoming(timeState: ChallengeTimeState): boolean {
	return (
		timeState.status === CHALLENGE_STATUS.ACTIVE || timeState.status === CHALLENGE_STATUS.UPCOMING
	);
}

export function getChallengeStatusBadge(
	timeState: ChallengeTimeState,
	isParticipating: boolean,
	isActive: boolean
): ChallengeStatusBadge | null {
	if (!isActive) return CHALLENGE_STATUS_BADGE.NOT_ACTIVE;
	if (timeState.status === CHALLENGE_STATUS.COMPLETED) return CHALLENGE_STATUS_BADGE.ENDED;
	if (
		isParticipating &&
		(timeState.status === CHALLENGE_STATUS.ACTIVE || timeState.status === CHALLENGE_STATUS.UPCOMING)
	)
		return CHALLENGE_STATUS_BADGE.YOURE_IN;
	return null;
}

export function formatTime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	if (h > 0) {
		return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}
	return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatResultDisplay(rankingValueSeconds: number | null): string {
	if (rankingValueSeconds != null) {
		return formatTime(rankingValueSeconds);
	}
	return '--';
}

/**
 * Formats an activity time for display, preferring moving time and falling back
 * to elapsed time when moving is not reported. Mirrors the UI-owned fallback
 * agreed for the strict-storage contract on challenge_participants /
 * challenge_contributions.
 */
export function formatDisplayTime(
	movingSeconds: number | null,
	elapsedSeconds: number | null
): string {
	if (movingSeconds != null) return formatTime(movingSeconds);
	if (elapsedSeconds != null) return formatTime(elapsedSeconds);
	return '--';
}

/**
 * Formats running pace as MM:SS per the user's distance unit, preferring moving
 * time and falling back to elapsed time to match the display-time contract.
 * Returns "--" when time or distance is missing / zero.
 */
export function formatPace(
	movingSeconds: number | null,
	elapsedSeconds: number | null,
	meters: number | null,
	unit: DistanceUnit
): string {
	const seconds = movingSeconds ?? elapsedSeconds;
	if (seconds == null || meters == null || meters <= 0) return '--';
	const distance = unit === DISTANCE_UNIT.MILES ? metersToMiles(meters) : metersToKm(meters);
	if (distance <= 0) return '--';
	const paceSec = seconds / distance;
	const mm = Math.floor(paceSec / 60);
	const ss = Math.round(paceSec % 60);
	return `${mm}:${ss.toString().padStart(2, '0')}${PACE_UNIT_LABEL[unit]}`;
}
