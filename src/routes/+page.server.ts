import { db } from '$lib/db';
import { memoriesTable, routineSchedulesTable } from '$lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }: { locals: App.Locals }) => {
	const { session } = await locals.safeGetSession();

	// Load memories and routine schedules from database
	const [memories, routineSchedules] = await Promise.all([
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

	return {
		session,
		memories,
		routineSchedules
	};
};
