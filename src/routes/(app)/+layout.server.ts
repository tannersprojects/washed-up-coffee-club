import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/db';
import { challengesTable } from '$lib/db/schema';
import { CHALLENGE_STATUS } from '$lib/constants';
import { and, eq, lte } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
	const now = new Date();

	// Sync challenge status from dates (lazy update; replace with cron later)

	await Promise.all([
		await db
			.update(challengesTable)
			.set({ status: CHALLENGE_STATUS.ACTIVE, updatedAt: now })
			.where(
				and(
					eq(challengesTable.status, CHALLENGE_STATUS.UPCOMING),
					lte(challengesTable.startDate, now)
				)
			),

		await db
			.update(challengesTable)
			.set({ status: CHALLENGE_STATUS.COMPLETED, updatedAt: now })
			.where(
				and(eq(challengesTable.status, CHALLENGE_STATUS.ACTIVE), lte(challengesTable.endDate, now))
			)
	]);

	const { session, user } = await locals.safeGetSession();
	const profile = locals.profile;

	if (!session || !user || !profile) {
		throw redirect(302, '/');
	}

	return {
		profile
	};
};
