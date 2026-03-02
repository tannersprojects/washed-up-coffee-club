import { formatTimeRemaining } from '$lib/utils/timer.js';
import type {
	ChallengeParticipantWithRelations,
	DashboardChallenge
} from '$lib/types/dashboard.js';
import { LeaderboardUI } from './LeaderboardUI.svelte';
import {
	getChallengeTimeStateFromDates,
	getJoinDisplayStateFromTimeState
} from '$lib/utils/challenge';
import {
	LEADERBOARD_TAB,
	type ChallengeType,
	type ChallengeStatus,
	type ChallengeJoinDisplayState,
	type LeaderboardTab,
	type DistanceUnit
} from '$lib/constants';
import type { ChallengeTimeState } from '$lib/types/challenge.js';

export class ChallengeUI {
	// Challenge data (immutable)
	readonly id: string;
	readonly title: string;
	readonly description: string;
	readonly type: ChallengeType;
	readonly startDate: Date;
	readonly endDate: Date;
	readonly goalDistance: number | null;
	readonly segmentId: number | null;
	readonly status: ChallengeStatus;
	readonly isActive: boolean;
	readonly createdAt: Date;

	// Participation
	participant: ChallengeParticipantWithRelations | null;
	isParticipating: boolean;

	// UI state
	leaderboard: LeaderboardUI;
	activeTab: LeaderboardTab;
	challengeTimeState: ChallengeTimeState;
	joinDisplayState: ChallengeJoinDisplayState;
	isSubmitting: boolean;
	timeLeft: string;

	// Private
	private countdownTick: number;
	private countdownInterval: ReturnType<typeof setInterval>;
	private profileId: string;

	constructor(challenge: DashboardChallenge, profileId: string, distanceUnit: DistanceUnit) {
		this.profileId = profileId;

		// Challenge fields
		this.id = challenge.id;
		this.title = challenge.title;
		this.description = challenge.description;
		this.type = challenge.type;
		this.startDate = challenge.startDate;
		this.endDate = challenge.endDate;
		this.goalDistance = challenge.goalDistance;
		this.segmentId = challenge.segmentId;
		this.status = challenge.status;
		this.isActive = challenge.isActive;
		this.createdAt = challenge.createdAt;

		// Participation
		this.participant = $state(this.findParticipant(challenge));
		this.isParticipating = $derived(this.participant !== null);

		// Countdown (always runs; cleanup() stops it)
		this.countdownTick = $state(0);
		this.countdownInterval = setInterval(() => {
			this.countdownTick++;
			if (formatTimeRemaining(this.challengeTimeState.targetDate) === '00:00:00') {
				this.stopCountdown();
			}
		}, 1000);

		// Leaderboard
		this.leaderboard = new LeaderboardUI(
			challenge.participants,
			this.goalDistance,
			this.type,
			distanceUnit
		);

		// Derived state
		this.activeTab = $state(LEADERBOARD_TAB.Leaderboard);
		this.challengeTimeState = $derived.by(() => {
			void this.countdownTick;
			return getChallengeTimeStateFromDates(this.startDate, this.endDate);
		});
		this.timeLeft = $derived(formatTimeRemaining(this.challengeTimeState.targetDate));
		this.joinDisplayState = $derived(
			getJoinDisplayStateFromTimeState(this.challengeTimeState, this.isParticipating)
		);
		this.isSubmitting = $state(false);
	}

	private findParticipant(challenge: DashboardChallenge): ChallengeParticipantWithRelations | null {
		return challenge.participants.find((p) => p.profileId === this.profileId) ?? null;
	}

	private stopCountdown() {
		clearInterval(this.countdownInterval);
	}

	cleanup() {
		this.stopCountdown();
	}

	// Participation
	join(challengeParticipantWithRelations: ChallengeParticipantWithRelations) {
		this.participant = challengeParticipantWithRelations;
		this.leaderboard.addChallengeParticipantWithRelations(challengeParticipantWithRelations);
		this.isSubmitting = false;
	}

	leave() {
		if (!this.participant) return;

		this.leaderboard.removeChallengeParticipantWithRelations(this.participant.id);
		this.participant = null;
		this.isSubmitting = false;
	}

	// Tabs
	setActiveTab(tab: LeaderboardTab) {
		this.activeTab = tab;
	}

	// Server sync
	updateFromServerData(challenge: DashboardChallenge) {
		this.participant = this.findParticipant(challenge);
		this.leaderboard.updateChallengeParticipantsWithRelations(challenge.participants);
	}

	// Queries
	getCurrentUserRank(profileId: string): number | null {
		if (!this.isParticipating) return null;

		const userRow = this.leaderboard.leaderboardRows.find((row) => row.profile.id === profileId);

		return userRow?.rank || null;
	}

	toJSON() {
		return {
			id: this.id,
			title: this.title,
			description: this.description,
			type: this.type,
			startDate: this.startDate,
			endDate: this.endDate,
			goalDistance: this.goalDistance,
			segmentId: this.segmentId,
			status: this.status,
			isActive: this.isActive,
			createdAt: this.createdAt,
			isParticipating: this.isParticipating,
			participant: this.participant,
			timeLeft: this.timeLeft
		};
	}
}
