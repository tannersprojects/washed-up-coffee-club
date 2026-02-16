import { formatTimeRemaining } from '$lib/utils/timer-utils.js';
import {
	LEADERBOARD_TAB,
	type ChallengeParticipantWithRelations,
	type ChallengeWithParticipation,
	type LeaderboardTab
} from '$lib/types/dashboard.js';
import type { ChallengeParticipant } from '$lib/db/schema.js';
import { LeaderboardUI } from './LeaderboardUI.svelte';
import {
	getChallengeJoinDisplayState,
	getChallengeTimeStateFromDates
} from '$lib/utils/challenge-utils';
import type {
	ChallengeType,
	ChallengeStatus,
	ChallengeJoinDisplayState,
	ChallengeTimeState
} from '$lib/constants';

export class ChallengeUI {
	// Challenge fields from database
	id: string;
	title: string;
	description: string;
	type: ChallengeType;
	startDate: Date;
	endDate: Date;
	goalValue: number | null;
	segmentId: number | null;
	status: ChallengeStatus;
	isActive: boolean;
	createdAt: Date;

	// Participation fields
	isParticipating: boolean;
	participant: ChallengeParticipant | null;

	// Reactive state
	leaderboard: LeaderboardUI;
	activeTab: LeaderboardTab;
	challengeTimeState: ChallengeTimeState;
	joinDisplayState: ChallengeJoinDisplayState;
	isSubmitting: boolean;
	timeLeft: string;
	private countdownInterval: ReturnType<typeof setInterval> | null;

	constructor(
		challengeWithParticipation: ChallengeWithParticipation,
		challengeParticipantsWithRelations: ChallengeParticipantWithRelations[]
	) {
		this.id = challengeWithParticipation.id;
		this.title = challengeWithParticipation.title;
		this.description = challengeWithParticipation.description;
		this.type = challengeWithParticipation.type;
		this.startDate = challengeWithParticipation.startDate;
		this.endDate = challengeWithParticipation.endDate;
		this.goalValue = challengeWithParticipation.goalValue;
		this.segmentId = challengeWithParticipation.segmentId;
		this.status = challengeWithParticipation.status;
		this.isActive = challengeWithParticipation.isActive;
		this.createdAt = challengeWithParticipation.createdAt;

		this.isParticipating = $state(challengeWithParticipation.isParticipating);
		this.participant = $state(challengeWithParticipation.participant);

		const initialState = getChallengeTimeStateFromDates(this.startDate, this.endDate);
		this.timeLeft = $state(formatTimeRemaining(initialState.targetDate));
		this.countdownInterval = null;
		this.leaderboard = new LeaderboardUI(challengeParticipantsWithRelations, this.goalValue);
		this.activeTab = $state(LEADERBOARD_TAB.Leaderboard);
		this.challengeTimeState = $derived.by(() => {
			void this.timeLeft; // dependency: re-run when countdown ticks
			return getChallengeTimeStateFromDates(this.startDate, this.endDate);
		});
		this.joinDisplayState = $derived.by(() => {
			void this.timeLeft;
			return getChallengeJoinDisplayState(this);
		});
		this.isSubmitting = $state(false);
	}

	startCountdown() {
		// Don't start if already running
		if (this.countdownInterval) return;

		// Update immediately using current target date
		this.timeLeft = formatTimeRemaining(this.challengeTimeState.targetDate);

		// Update every second
		this.countdownInterval = setInterval(() => {
			const targetDate = this.challengeTimeState.targetDate;
			const formatted = formatTimeRemaining(targetDate);
			this.timeLeft = formatted;

			// Stop when time expires
			if (formatted === '00:00:00') {
				this.stopCountdown();
			}
		}, 1000);
	}

	stopCountdown() {
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
			this.countdownInterval = null;
		}
	}

	join(challengeParticipantWithRelations: ChallengeParticipantWithRelations) {
		this.isParticipating = true;
		this.participant = challengeParticipantWithRelations;
		this.leaderboard.addChallengeParticipantWithRelations(challengeParticipantWithRelations);
		this.isSubmitting = false;
	}

	leave() {
		if (!this.participant) return;

		this.leaderboard.removeChallengeParticipantWithRelations(this.participant.id);
		this.isParticipating = false;
		this.participant = null;
		this.isSubmitting = false;
	}

	setActiveTab(tab: LeaderboardTab) {
		this.activeTab = tab;
	}

	/**
	 * Update challenge from fresh server data
	 * Syncs participation state and leaderboard participants
	 */
	updateFromServerData(
		challengeWithParticipation: ChallengeWithParticipation,
		challengeParticipantsWithRelations: ChallengeParticipantWithRelations[]
	) {
		// Update participation state from server
		this.isParticipating = challengeWithParticipation.isParticipating;
		this.participant = challengeWithParticipation.participant;

		// Update leaderboard with fresh participant data
		this.leaderboard.updateChallengeParticipantsWithRelations(challengeParticipantsWithRelations);
	}

	/**
	 * Get the current user's rank in this challenge
	 * Returns null if user is not participating or hasn't finished
	 */
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
			goalValue: this.goalValue,
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
