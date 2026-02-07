import { formatTimeRemaining } from '$lib/utils/timer-utils.js';
import type {
	ChallengeParticipantWithRelations,
	ChallengeWithParticipation
} from '$lib/types/dashboard.js';
import type { ChallengeParticipant } from '$lib/db/schema.js';
import { LeaderboardUI } from './LeaderboardUI.svelte';
import { isChallengeJoinable } from '$lib/utils/challenge-utils';
import type { ChallengeType, ChallengeStatus } from '$lib/constants';

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
	activeTab: 'leaderboard' | 'details';
	joinable: boolean;
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

		this.timeLeft = $state(formatTimeRemaining(this.endDate));
		this.countdownInterval = null;
		this.leaderboard = new LeaderboardUI(challengeParticipantsWithRelations, this.goalValue);
		this.activeTab = $state('leaderboard');
		this.joinable = $derived(isChallengeJoinable(this));
		this.isSubmitting = $state(false);
	}

	startCountdown() {
		// Don't start if already running
		if (this.countdownInterval) return;

		// Update immediately
		this.timeLeft = formatTimeRemaining(this.endDate);

		// Update every second
		this.countdownInterval = setInterval(() => {
			const formatted = formatTimeRemaining(this.endDate);
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

	setActiveTab(tab: 'leaderboard' | 'details') {
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
