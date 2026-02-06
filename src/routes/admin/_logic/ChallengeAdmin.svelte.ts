import type { AdminServerData } from './context.js';
import type { ChallengeParticipant } from '$lib/db/schema.js';

type ChallengeRow = AdminServerData['challenges'][number];

export class ChallengeAdmin {
	id: string;
	title: string;
	description: string;
	type: string;
	goalValue: number | null;
	segmentId: number | null;
	startDate: Date;
	endDate: Date;
	status: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	participants: ChallengeParticipant[];

	constructor(row: ChallengeRow) {
		this.id = row.id;
		this.title = row.title;
		this.description = row.description;
		this.type = row.type;
		this.goalValue = row.goalValue;
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
			goalValue: this.goalValue,
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
