import { fail, redirect } from '@sveltejs/kit';
import { eq, asc, desc } from 'drizzle-orm';
import { PROFILE_ROLE, CHALLENGE_TYPE, CHALLENGE_STATUS } from '$lib/constants';
import { db } from '$lib/db';
import { memoriesTable, routineSchedulesTable, challengesTable } from '$lib/db/schema';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { AdminPageData } from '$lib/types/admin.js';
import { loadAdminData } from './loader.server.js';
import type { PageServerLoad, Actions } from './$types';

const MEMORY_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MEMORY_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VALID_CHALLENGE_TYPES = Object.values(CHALLENGE_TYPE);
const VALID_CHALLENGE_STATUSES = Object.values(CHALLENGE_STATUS);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(s: string): boolean {
	return UUID_REGEX.test(s);
}

export const load: PageServerLoad = async ({ locals }: { locals: App.Locals }) => {
	const profile = locals.profile;

	if (!profile) {
		console.error('Profile not found');
		throw redirect(302, '/');
	}

	if (profile.role !== PROFILE_ROLE.ADMIN) {
		console.error('Profile is not an admin');
		throw redirect(302, '/');
	}

	const { memories, routineSchedules, challenges } = await loadAdminData();

	const result: AdminPageData = {
		profile,
		memories,
		routineSchedules,
		challenges
	};

	return result;
};

function requireAdmin(profile: App.Locals['profile']) {
	if (!profile || profile.role !== PROFILE_ROLE.ADMIN) {
		return fail(401, { error: 'Unauthorized' });
	}
	return null;
}

export const actions: Actions = {
	// --- MEMORIES ---
	createMemory: async ({ request, locals }) => {
		const authFail = requireAdmin(locals.profile);
		if (authFail) return authFail;

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const file = formData.get('file') as File | null;
		const caption = formData.get('caption')?.toString()?.trim() ?? '';

		if (!id || !isValidUuid(id)) {
			return fail(400, { error: 'Invalid ID.' });
		}

		const existingMemory = await db.query.memoriesTable.findFirst({
			where: eq(memoriesTable.id, id)
		});
		if (existingMemory) {
			return fail(400, { error: 'Memory already exists.' });
		}

		if (!file || file.size === 0) {
			return fail(400, { error: 'Please select an image to upload.' });
		}
		if (!ALLOWED_MEMORY_TYPES.includes(file.type)) {
			return fail(400, {
				error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF.'
			});
		}
		if (file.size > MEMORY_MAX_SIZE_BYTES) {
			return fail(413, {
				error: 'Image must be 5MB or smaller.'
			});
		}
		if (caption.length === 0) {
			return fail(400, { error: 'Caption is required.' });
		}
		if (caption.length > 500) {
			return fail(400, { error: 'Caption must be 500 characters or less.' });
		}

		const ext = file.name.split('.').pop() || 'jpg';
		const path = `${crypto.randomUUID()}.${ext}`;
		const supabase = locals.supabase;

		const { error: uploadError } = await supabase.storage
			.from('memories')
			.upload(path, file, { upsert: true });

		if (uploadError) {
			console.error('Storage upload error:', uploadError);
			return fail(500, { error: 'Failed to upload image. Please try again.' });
		}

		const src = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/memories/${path}`;

		try {
			const [last] = await db
				.select({ sortOrder: memoriesTable.sortOrder })
				.from(memoriesTable)
				.orderBy(desc(memoriesTable.sortOrder))
				.limit(1);
			const nextSortOrder = (last?.sortOrder ?? -1) + 1;

			await db.insert(memoriesTable).values({
				id,
				src,
				caption,
				sortOrder: nextSortOrder,
				isActive: true
			});
		} catch (error) {
			console.error('DB insert error after upload:', error);
			await supabase.storage.from('memories').remove([path]);
			return fail(500, { error: 'Failed to save memory. Please try again.' });
		}

		return { success: true };
	},

	updateMemory: async ({ request, locals }) => {
		const authFail = requireAdmin(locals.profile);
		if (authFail) return authFail;

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const caption = formData.get('caption')?.toString()?.trim() ?? '';
		const sortOrder = parseInt(formData.get('sortOrder')?.toString() ?? '', 10);
		const isActive = formData.get('isActive') === 'true';

		if (!id || !isValidUuid(id)) {
			return fail(400, { error: 'Invalid memory ID.' });
		}

		const existing = await db.query.memoriesTable.findFirst({
			where: eq(memoriesTable.id, id)
		});
		if (!existing) {
			return fail(404, { error: 'Memory not found.' });
		}

		if (caption.length === 0) {
			return fail(400, { error: 'Caption is required.' });
		}
		if (caption.length > 500) {
			return fail(400, { error: 'Caption must be 500 characters or less.' });
		}
		if (isNaN(sortOrder) || sortOrder < 0) {
			return fail(400, { error: 'Sort order must be a non-negative number.' });
		}

		try {
			await db
				.update(memoriesTable)
				.set({
					caption,
					sortOrder,
					isActive,
					updatedAt: new Date()
				})
				.where(eq(memoriesTable.id, id));
		} catch (error) {
			console.error('Update memory error:', error);
			return fail(500, { error: 'Failed to update memory. Please try again.' });
		}

		return { success: true };
	},

	deleteMemory: async ({ request, locals }) => {
		const authFail = requireAdmin(locals.profile);
		if (authFail) return authFail;

		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id || !isValidUuid(id)) {
			return fail(400, { error: 'Invalid memory ID.' });
		}

		const existing = await db.query.memoriesTable.findFirst({
			where: eq(memoriesTable.id, id)
		});
		if (!existing) {
			return fail(404, { error: 'Memory not found.' });
		}

		const pathMatch = existing.src.match(/\/memories\/(.+)$/);
		const path = pathMatch?.[1];
		if (path) {
			await locals.supabase.storage.from('memories').remove([path]);
		}

		try {
			await db.delete(memoriesTable).where(eq(memoriesTable.id, id));
		} catch (error) {
			console.error('Delete memory error:', error);
			return fail(500, { error: 'Failed to delete memory. Please try again.' });
		}

		return { success: true };
	},

	reorderMemories: async ({ request, locals }) => {
		const authFail = requireAdmin(locals.profile);
		if (authFail) return authFail;

		const formData = await request.formData();
		const raw = formData.get('orderedIds')?.toString();
		if (!raw) {
			return fail(400, { error: 'Ordered IDs are required.' });
		}

		let orderedIds: string[];
		try {
			orderedIds = JSON.parse(raw) as string[];
		} catch {
			return fail(400, { error: 'Invalid ordered IDs format.' });
		}

		if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
			return fail(400, { error: 'Ordered IDs must be a non-empty array.' });
		}
		if (!orderedIds.every((id) => typeof id === 'string' && isValidUuid(id))) {
			return fail(400, { error: 'All IDs must be valid UUIDs.' });
		}

		try {
			for (let i = 0; i < orderedIds.length; i++) {
				await db
					.update(memoriesTable)
					.set({ sortOrder: i, updatedAt: new Date() })
					.where(eq(memoriesTable.id, orderedIds[i]!));
			}
		} catch (error) {
			console.error('Reorder memories error:', error);
			return fail(500, { error: 'Failed to reorder memories. Please try again.' });
		}

		return { success: true };
	},

	// --- ROUTINE SCHEDULES ---
	createRoutineSchedule: async ({ request, locals }) => {
		const authFail = requireAdmin(locals.profile);
		if (authFail) return authFail;

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const day = formData.get('day')?.toString()?.trim() ?? '';
		const time = formData.get('time')?.toString()?.trim() ?? '';
		const location = formData.get('location')?.toString()?.trim() ?? '';
		const accentColor = formData.get('accentColor')?.toString()?.trim() ?? '';
		const description = formData.get('description')?.toString()?.trim() ?? '';

		if (!id || !isValidUuid(id)) {
			return fail(400, { error: 'Invalid ID.' });
		}

		const existingSchedule = await db.query.routineSchedulesTable.findFirst({
			where: eq(routineSchedulesTable.id, id)
		});
		if (existingSchedule) {
			return fail(400, { error: 'Schedule already exists.' });
		}

		if (!day || day.length > 50) {
			return fail(400, { error: 'Day is required and must be 50 characters or less.' });
		}
		if (!time || time.length > 20) {
			return fail(400, { error: 'Time is required and must be 20 characters or less.' });
		}
		if (!location || location.length > 200) {
			return fail(400, {
				error: 'Location is required and must be 200 characters or less.'
			});
		}
		if (!accentColor || accentColor.length > 100) {
			return fail(400, {
				error: 'Accent color is required and must be 100 characters or less.'
			});
		}
		if (!description || description.length > 500) {
			return fail(400, {
				error: 'Description is required and must be 500 characters or less.'
			});
		}

		try {
			const [last] = await db
				.select({ sortOrder: routineSchedulesTable.sortOrder })
				.from(routineSchedulesTable)
				.orderBy(desc(routineSchedulesTable.sortOrder))
				.limit(1);
			const nextSortOrder = (last?.sortOrder ?? -1) + 1;

			await db.insert(routineSchedulesTable).values({
				id,
				day,
				time,
				location,
				accentColor,
				description,
				sortOrder: nextSortOrder,
				isActive: true
			});
		} catch (error) {
			console.error('Create routine schedule error:', error);
			return fail(500, {
				error: 'Failed to create schedule. Please try again.'
			});
		}

		return { success: true };
	},

	updateRoutineSchedule: async ({ request, locals }) => {
		const authFail = requireAdmin(locals.profile);
		if (authFail) return authFail;

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const day = formData.get('day')?.toString()?.trim() ?? '';
		const time = formData.get('time')?.toString()?.trim() ?? '';
		const location = formData.get('location')?.toString()?.trim() ?? '';
		const accentColor = formData.get('accentColor')?.toString()?.trim() ?? '';
		const description = formData.get('description')?.toString()?.trim() ?? '';

		if (!id || !isValidUuid(id)) {
			return fail(400, { error: 'Invalid schedule ID.' });
		}

		const existing = await db.query.routineSchedulesTable.findFirst({
			where: eq(routineSchedulesTable.id, id)
		});
		if (!existing) {
			return fail(404, { error: 'Schedule not found.' });
		}

		if (!day || day.length > 50) {
			return fail(400, { error: 'Day is required and must be 50 characters or less.' });
		}
		if (!time || time.length > 20) {
			return fail(400, { error: 'Time is required and must be 20 characters or less.' });
		}
		if (!location || location.length > 200) {
			return fail(400, {
				error: 'Location is required and must be 200 characters or less.'
			});
		}
		if (!accentColor || accentColor.length > 100) {
			return fail(400, {
				error: 'Accent color is required and must be 100 characters or less.'
			});
		}
		if (!description || description.length > 500) {
			return fail(400, {
				error: 'Description is required and must be 500 characters or less.'
			});
		}

		try {
			await db
				.update(routineSchedulesTable)
				.set({
					day,
					time,
					location,
					accentColor,
					description,
					updatedAt: new Date()
				})
				.where(eq(routineSchedulesTable.id, id));
		} catch (error) {
			console.error('Update routine schedule error:', error);
			return fail(500, {
				error: 'Failed to update schedule. Please try again.'
			});
		}

		return { success: true };
	},

	deleteRoutineSchedule: async ({ request, locals }) => {
		const authFail = requireAdmin(locals.profile);
		if (authFail) return authFail;

		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id || !isValidUuid(id)) {
			return fail(400, { error: 'Invalid schedule ID.' });
		}

		const existing = await db.query.routineSchedulesTable.findFirst({
			where: eq(routineSchedulesTable.id, id)
		});
		if (!existing) {
			return fail(404, { error: 'Schedule not found.' });
		}

		try {
			await db.delete(routineSchedulesTable).where(eq(routineSchedulesTable.id, id));
		} catch (error) {
			console.error('Delete routine schedule error:', error);
			return fail(500, {
				error: 'Failed to delete schedule. Please try again.'
			});
		}

		return { success: true };
	},

	toggleRoutineSchedule: async ({ request, locals }) => {
		const authFail = requireAdmin(locals.profile);
		if (authFail) return authFail;

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const isActive = formData.get('isActive') === 'true';

		if (!id || !isValidUuid(id)) {
			return fail(400, { error: 'Invalid schedule ID.' });
		}

		const existing = await db.query.routineSchedulesTable.findFirst({
			where: eq(routineSchedulesTable.id, id)
		});
		if (!existing) {
			return fail(404, { error: 'Schedule not found.' });
		}

		try {
			await db
				.update(routineSchedulesTable)
				.set({ isActive, updatedAt: new Date() })
				.where(eq(routineSchedulesTable.id, id));
		} catch (error) {
			console.error('Toggle routine schedule error:', error);
			return fail(500, {
				error: 'Failed to update schedule. Please try again.'
			});
		}

		return { success: true };
	},

	// --- CHALLENGES ---
	createChallenge: async ({ request, locals }) => {
		const authFail = requireAdmin(locals.profile);
		if (authFail) return authFail;

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id || !isValidUuid(id)) {
			console.error('Invalid challenge ID:', id);
			return fail(400, { error: 'Invalid challenge ID.' });
		}

		const existing = await db.query.challengesTable.findFirst({
			where: eq(challengesTable.id, id)
		});
		if (existing) {
			return fail(400, { error: 'Challenge already exists.' });
		}

		const title = formData.get('title')?.toString()?.trim() ?? '';
		const description = formData.get('description')?.toString()?.trim() ?? '';
		const type = formData.get('type')?.toString() ?? '';
		const goalValueRaw = formData.get('goalValue')?.toString();
		const segmentIdRaw = formData.get('segmentId')?.toString();
		const startDateRaw = formData.get('startDate')?.toString();
		const endDateRaw = formData.get('endDate')?.toString();
		const status = formData.get('status')?.toString() ?? CHALLENGE_STATUS.UPCOMING;

		if (!title || title.length > 200) {
			return fail(400, {
				error: 'Title is required and must be 200 characters or less.'
			});
		}
		if (!VALID_CHALLENGE_TYPES.includes(type as (typeof VALID_CHALLENGE_TYPES)[number])) {
			return fail(400, { error: 'Invalid challenge type.' });
		}
		if (!VALID_CHALLENGE_STATUSES.includes(status as (typeof VALID_CHALLENGE_STATUSES)[number])) {
			return fail(400, { error: 'Invalid challenge status.' });
		}

		const goalValue = goalValueRaw ? parseInt(goalValueRaw, 10) : null;
		const segmentId = segmentIdRaw ? parseInt(segmentIdRaw, 10) : null;
		const startDate = startDateRaw ? new Date(startDateRaw) : null;
		const endDate = endDateRaw ? new Date(endDateRaw) : null;

		if (
			(type === CHALLENGE_TYPE.CUMULATIVE || type === CHALLENGE_TYPE.BEST_EFFORT) &&
			(goalValue === null || isNaN(goalValue) || goalValue <= 0)
		) {
			return fail(400, {
				error: 'Goal value is required for cumulative and best-effort challenges.'
			});
		}
		if (type === CHALLENGE_TYPE.SEGMENT_RACE && (segmentId === null || isNaN(segmentId))) {
			return fail(400, {
				error: 'Segment ID is required for segment race challenges.'
			});
		}
		if (!startDate || isNaN(startDate.getTime())) {
			console.error('Start date is required and must be valid:', startDate);
			return fail(400, { error: 'Start date is required and must be valid.' });
		}
		if (!endDate || isNaN(endDate.getTime())) {
			return fail(400, { error: 'End date is required and must be valid.' });
		}
		if (startDate >= endDate) {
			return fail(400, { error: 'End date must be after start date.' });
		}

		try {
			await db.insert(challengesTable).values({
				id,
				title,
				description,
				type: type as (typeof VALID_CHALLENGE_TYPES)[number],
				goalValue: goalValue ?? undefined,
				segmentId: segmentId ?? undefined,
				startDate,
				endDate,
				status: status as (typeof VALID_CHALLENGE_STATUSES)[number]
			});
		} catch (error) {
			console.error('Create challenge error:', error);
			return fail(500, {
				error: 'Failed to create challenge. Please try again.'
			});
		}

		return { success: true };
	},

	updateChallenge: async ({ request, locals }) => {
		const authFail = requireAdmin(locals.profile);
		if (authFail) return authFail;

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const title = formData.get('title')?.toString()?.trim() ?? '';
		const description = formData.get('description')?.toString()?.trim() ?? '';
		const type = formData.get('type')?.toString() ?? '';
		const goalValueRaw = formData.get('goalValue')?.toString();
		const segmentIdRaw = formData.get('segmentId')?.toString();
		const startDateRaw = formData.get('startDate')?.toString();
		const endDateRaw = formData.get('endDate')?.toString();
		const status = formData.get('status')?.toString() ?? CHALLENGE_STATUS.UPCOMING;

		if (!id || !isValidUuid(id)) {
			return fail(400, { error: 'Invalid challenge ID.' });
		}

		const existing = await db.query.challengesTable.findFirst({
			where: eq(challengesTable.id, id)
		});
		if (!existing) {
			return fail(404, { error: 'Challenge not found.' });
		}

		if (!title || title.length > 200) {
			return fail(400, {
				error: 'Title is required and must be 200 characters or less.'
			});
		}
		if (!VALID_CHALLENGE_TYPES.includes(type as (typeof VALID_CHALLENGE_TYPES)[number])) {
			return fail(400, { error: 'Invalid challenge type.' });
		}
		if (!VALID_CHALLENGE_STATUSES.includes(status as (typeof VALID_CHALLENGE_STATUSES)[number])) {
			return fail(400, { error: 'Invalid challenge status.' });
		}

		const goalValue = goalValueRaw ? parseInt(goalValueRaw, 10) : null;
		const segmentId = segmentIdRaw ? parseInt(segmentIdRaw, 10) : null;
		const startDate = startDateRaw ? new Date(startDateRaw) : null;
		const endDate = endDateRaw ? new Date(endDateRaw) : null;

		if (
			(type === CHALLENGE_TYPE.CUMULATIVE || type === CHALLENGE_TYPE.BEST_EFFORT) &&
			(goalValue === null || isNaN(goalValue) || goalValue <= 0)
		) {
			return fail(400, {
				error: 'Goal value is required for cumulative and best-effort challenges.'
			});
		}
		if (type === CHALLENGE_TYPE.SEGMENT_RACE && (segmentId === null || isNaN(segmentId))) {
			return fail(400, {
				error: 'Segment ID is required for segment race challenges.'
			});
		}
		if (!startDate || isNaN(startDate.getTime())) {
			return fail(400, { error: 'Start date is required and must be valid.' });
		}
		if (!endDate || isNaN(endDate.getTime())) {
			return fail(400, { error: 'End date is required and must be valid.' });
		}
		if (startDate >= endDate) {
			return fail(400, { error: 'End date must be after start date.' });
		}

		try {
			await db
				.update(challengesTable)
				.set({
					title,
					description,
					type: type as (typeof VALID_CHALLENGE_TYPES)[number],
					goalValue: goalValue ?? undefined,
					segmentId: segmentId ?? undefined,
					startDate,
					endDate,
					status: status as (typeof VALID_CHALLENGE_STATUSES)[number],
					updatedAt: new Date()
				})
				.where(eq(challengesTable.id, id));
		} catch (error) {
			console.error('Update challenge error:', error);
			return fail(500, {
				error: 'Failed to update challenge. Please try again.'
			});
		}

		return { success: true };
	},

	deleteChallenge: async ({ request, locals }) => {
		const authFail = requireAdmin(locals.profile);
		if (authFail) return authFail;

		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id || !isValidUuid(id)) {
			return fail(400, { error: 'Invalid challenge ID.' });
		}

		const existing = await db.query.challengesTable.findFirst({
			where: eq(challengesTable.id, id)
		});
		if (!existing) {
			return fail(404, { error: 'Challenge not found.' });
		}

		try {
			await db.delete(challengesTable).where(eq(challengesTable.id, id));
		} catch (error) {
			console.error('Delete challenge error:', error);
			return fail(500, {
				error: 'Failed to delete challenge. Please try again.'
			});
		}

		return { success: true };
	}
};
