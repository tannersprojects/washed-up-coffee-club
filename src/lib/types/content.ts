/**
 * Type definitions for content models (memories, routine schedules, etc.)
 */

export interface Memory {
	id: string;
	src: string;
	caption: string;
	sortOrder: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface RoutineSchedule {
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
}
