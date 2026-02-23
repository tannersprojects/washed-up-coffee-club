import { SUPABASE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { db } from '$lib/db';
import { stravaConnectionsTable, profileTable } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { StravaTokenResponse, StravaSummaryAthlete } from '$lib/types/strava';

const adminClient = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

export async function findOrCreateShadowUser(
	athleteData: StravaSummaryAthlete,
	tokens: StravaTokenResponse
): Promise<string> {
	const existingConnection = await db
		.select()
		.from(stravaConnectionsTable)
		.where(eq(stravaConnectionsTable.stravaAthleteId, athleteData.id))
		.limit(1);

	if (existingConnection.length > 0) {
		const userId = existingConnection[0].profileId;

		await db
			.update(stravaConnectionsTable)
			.set({
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				expiresAt: new Date(tokens.expires_at * 1000),
				scope: 'activity:read_all,profile:read_all',
				updatedAt: new Date()
			})
			.where(eq(stravaConnectionsTable.stravaAthleteId, athleteData.id));

		await updateUserProfile(userId, athleteData);

		return userId;
	}

	const shadowEmail = `${athleteData.id}@strava.washed-up.club`;

	const { data: user, error: userError } = await adminClient.auth.admin.createUser({
		email: shadowEmail,
		email_confirm: true,
		user_metadata: {
			strava_athlete_id: athleteData.id,
			firstname: athleteData.firstname,
			lastname: athleteData.lastname,
			username: athleteData.username
		}
	});

	if (userError || !user) {
		throw new Error(`Failed to create shadow user: ${userError?.message || 'Unknown error'}`);
	}

	try {
		await db.insert(profileTable).values({
			id: user.user.id,
			firstname: athleteData.firstname,
			lastname: athleteData.lastname,
			username: athleteData.username || `user_${athleteData.id}`,
			stravaAthleteId: athleteData.id,
			updatedAt: new Date()
		});
	} catch (profileError) {
		console.warn('Profile creation warning:', profileError);
	}

	await db.insert(stravaConnectionsTable).values({
		profileId: user.user.id,
		stravaAthleteId: athleteData.id,
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		expiresAt: new Date(tokens.expires_at * 1000),
		scope: 'activity:read_all,profile:read_all'
	});

	return user.user.id;
}

export async function updateUserProfile(
	userId: string,
	athleteData: StravaSummaryAthlete
): Promise<void> {
	await db
		.update(profileTable)
		.set({
			firstname: athleteData.firstname,
			lastname: athleteData.lastname,
			username: athleteData.username || `user_${athleteData.id}`,
			stravaAthleteId: athleteData.id,
			updatedAt: new Date()
		})
		.where(eq(profileTable.id, userId));
}

export async function getStravaConnection(userId: string) {
	const connection = await db
		.select()
		.from(stravaConnectionsTable)
		.where(eq(stravaConnectionsTable.profileId, userId))
		.limit(1);

	return connection[0] || null;
}

export async function getUserProfile(userId: string) {
	const profile = await db.query.profileTable.findFirst({
		where: eq(profileTable.id, userId)
	});

	return profile || null;
}
