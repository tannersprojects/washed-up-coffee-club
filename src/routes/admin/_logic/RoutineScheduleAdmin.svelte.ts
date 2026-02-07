import type { RoutineScheduleRow } from '$lib/types/admin';

export class RoutineScheduleAdmin {
	id: string;
	day: string;
	time: string;
	location: string;
	accentColor: string;
	description: string;
	sortOrder: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;

	constructor(row: RoutineScheduleRow) {
		this.id = row.id;
		this.day = row.day;
		this.time = row.time;
		this.location = row.location;
		this.accentColor = row.accentColor;
		this.description = row.description;
		this.sortOrder = row.sortOrder;
		this.isActive = row.isActive;
		this.createdAt = row.createdAt;
		this.updatedAt = row.updatedAt;
	}

	toJSON() {
		return {
			id: this.id,
			day: this.day,
			time: this.time,
			location: this.location,
			accentColor: this.accentColor,
			description: this.description,
			sortOrder: this.sortOrder,
			isActive: this.isActive,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt
		};
	}
}
