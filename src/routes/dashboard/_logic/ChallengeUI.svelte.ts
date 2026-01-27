import { formatTimeRemaining } from '$lib/utils/timer-utils.js';
import type { ChallengeWithParticipation } from '$lib/types/dashboard.js';
import type { ChallengeParticipant } from '$lib/db/schema.js';

/**
 * ChallengeUI class - Manages individual challenge state and countdown logic
 *
 * This class transforms raw challenge data into a reactive instance with:
 * - All challenge properties from the database
 * - Participation status (isParticipating, participant)
 * - Live countdown timer (timeLeft)
 * - Timer lifecycle management (start/stop)
 */
export class ChallengeUI {
	// Challenge fields from database
	id: string;
	title: string;
	description: string;
	type: string;
	startDate: Date;
	endDate: Date;
	goalValue: number | null;
	segmentId: number | null;
	status: string;
	isActive: boolean;
	createdAt: Date;

	// Participation fields
	isParticipating: boolean;
	participant: ChallengeParticipant | null;

	// Reactive state
	timeLeft: string;
	private countdownInterval: ReturnType<typeof setInterval> | null;

	constructor(data: ChallengeWithParticipation) {
		// Initialize all challenge fields
		this.id = data.id;
		this.title = data.title;
		this.description = data.description;
		this.type = data.type;
		this.startDate = data.startDate;
		this.endDate = data.endDate;
		this.goalValue = data.goalValue;
		this.segmentId = data.segmentId;
		this.status = data.status;
		this.isActive = data.isActive;
		this.createdAt = data.createdAt;

		// Initialize participation fields
		this.isParticipating = $state(data.isParticipating);
		this.participant = $state(data.participant);

		// Initialize reactive state
		this.timeLeft = $state(formatTimeRemaining(this.endDate));
		this.countdownInterval = null;
	}

	/**
	 * Start the countdown timer
	 * Updates timeLeft every second until challenge ends
	 */
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

	/**
	 * Stop the countdown timer
	 * Cleans up interval to prevent memory leaks
	 */
	stopCountdown() {
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
			this.countdownInterval = null;
		}
	}

	/**
	 * Serialize to JSON (exclude interval reference)
	 * Useful for debugging and logging
	 */
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
