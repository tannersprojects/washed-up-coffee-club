import type { RoutineSchedule } from '$lib/db/schema';

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

	constructor(routineSchedule: RoutineSchedule) {
		this.id = routineSchedule.id;
		this.day = routineSchedule.day;
		this.time = routineSchedule.time;
		this.location = routineSchedule.location;
		this.accentColor = routineSchedule.accentColor;
		this.description = routineSchedule.description;
		this.sortOrder = routineSchedule.sortOrder;
		this.isActive = routineSchedule.isActive;
		this.createdAt = routineSchedule.createdAt;
		this.updatedAt = routineSchedule.updatedAt;
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
