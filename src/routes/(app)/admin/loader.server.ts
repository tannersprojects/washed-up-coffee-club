import { asc } from 'drizzle-orm';
import { db } from '$lib/db';
import {
	memoriesTable,
	routineSchedulesTable,
	challengesTable,
	landingCopyTable
} from '$lib/db/schema';
import type { AdminContextData } from '$lib/types/admin.js';

export async function loadAdminData(): Promise<AdminContextData> {
	const defaultResult: AdminContextData = {
		memories: [],
		routineSchedules: [],
		challenges: [],
		landingCopy: []
	};

	try {
		const [memories, routineSchedules, challenges, landingCopy] = await Promise.all([
			db.select().from(memoriesTable).orderBy(asc(memoriesTable.sortOrder)),
			db.select().from(routineSchedulesTable).orderBy(asc(routineSchedulesTable.sortOrder)),
			db.query.challengesTable.findMany({
				with: { participants: true },
				orderBy: [asc(challengesTable.startDate)]
			}),
			db.select().from(landingCopyTable).orderBy(asc(landingCopyTable.sortOrder))
		]);

		return {
			memories,
			routineSchedules,
			challenges,
			landingCopy
		};
	} catch (error) {
		console.error('Admin load error:', error);
		return defaultResult;
	}
}
