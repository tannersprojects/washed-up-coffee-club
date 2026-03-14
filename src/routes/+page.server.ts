import { db } from '$lib/db';
import { memoriesTable, routineSchedulesTable, landingCopyTable } from '$lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import type { Memory, RoutineSchedule, LandingCopy } from '$lib/db/schema';

export const load: PageServerLoad = async ({ locals }: { locals: App.Locals }) => {
	const { session } = await locals.safeGetSession();

	let memories: Memory[] = [];
	let routineSchedules: RoutineSchedule[] = [];
	let landingCopy: LandingCopy[] = [];

	try {
		[memories, routineSchedules, landingCopy] = await Promise.all([
			db.query.memoriesTable.findMany({
				where: eq(memoriesTable.isActive, true),
				orderBy: asc(memoriesTable.sortOrder)
			}),
			db.query.routineSchedulesTable.findMany({
				where: eq(routineSchedulesTable.isActive, true),
				orderBy: asc(routineSchedulesTable.sortOrder)
			}),
			db.query.landingCopyTable.findMany({ orderBy: asc(landingCopyTable.sortOrder) })
		]);
	} catch (error) {
		console.error(error);
	}

	return {
		session,
		memories,
		routineSchedules,
		landingCopy
	};
};
