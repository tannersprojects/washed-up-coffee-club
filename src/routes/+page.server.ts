import { db } from '$lib/db';
import { memoriesTable, routineSchedulesTable } from '$lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import type { Memory, RoutineSchedule } from '$lib/types/content';

export const load: PageServerLoad = async ({ locals }: { locals: App.Locals }) => {
	const { session } = await locals.safeGetSession();

	let memories: Memory[] = [];
	let routineSchedules: RoutineSchedule[] = [];

	try {
		[memories, routineSchedules] = await Promise.all([
			db
				.select()
				.from(memoriesTable)
				.where(eq(memoriesTable.isActive, true))
				.orderBy(asc(memoriesTable.sortOrder)),
			db
				.select()
				.from(routineSchedulesTable)
				.where(eq(routineSchedulesTable.isActive, true))
				.orderBy(asc(routineSchedulesTable.sortOrder))
		]);
	} catch (error) {
		console.error(error);
	}

	return {
		session,
		memories,
		routineSchedules
	};
};
