import type { ChallengeParticipant } from '$lib/db/schema';
import type { ChallengeWithParticipants } from '$lib/types/admin';
import type { RankingMetric } from '$lib/constants';

export class ChallengeAdmin {
	id: string;
	title: string;
	description: string;
	type: string;
	rankingMetric: RankingMetric;
	goalDistance: number | null;
	segmentId: number | null;
	startDate: Date;
	endDate: Date;
	status: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	participants: ChallengeParticipant[];

	constructor(row: ChallengeWithParticipants) {
		this.id = row.id;
		this.title = row.title;
		this.description = row.description;
		this.type = row.type;
		this.rankingMetric = row.rankingMetric;
		this.goalDistance = row.goalDistance;
		this.segmentId = row.segmentId;
		this.startDate = row.startDate;
		this.endDate = row.endDate;
		this.status = row.status;
		this.isActive = row.isActive;
		this.createdAt = row.createdAt;
		this.updatedAt = row.updatedAt;
		this.participants = row.participants ?? [];
	}

	get participantCount(): number {
		return this.participants.length;
	}

	toJSON() {
		return {
			id: this.id,
			title: this.title,
			description: this.description,
			type: this.type,
			rankingMetric: this.rankingMetric,
			goalDistance: this.goalDistance,
			segmentId: this.segmentId,
			startDate: this.startDate,
			endDate: this.endDate,
			status: this.status,
			isActive: this.isActive,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
			participantCount: this.participantCount
		};
	}
}
