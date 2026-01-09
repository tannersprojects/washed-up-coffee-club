import { SUPABASE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { db } from '$lib/db';
import { stravaConnectionsTable, profileTable } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { StravaTokenResponse, StravaSummaryAthlete } from '$lib/types/strava';

// Create admin client for service role operations
const adminClient = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

/**
 * Finds or creates a shadow user for a Strava athlete
 * @param athleteData - Strava athlete profile data
 * @param tokens - OAuth tokens from Strava
 * @returns Supabase user ID
 */
export async function findOrCreateShadowUser(
	athleteData: StravaSummaryAthlete,
	tokens: StravaTokenResponse
): Promise<string> {
	// Check if connection already exists
	const existingConnection = await db
		.select()
		.from(stravaConnectionsTable)
		.where(eq(stravaConnectionsTable.stravaAthleteId, athleteData.id))
		.limit(1);

	if (existingConnection.length > 0) {
		const userId = existingConnection[0].userId;

		// Update existing connection with new tokens
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

		// Update profile data if Strava profile has changed
		await updateUserProfile(userId, athleteData);

		return userId;
	}

	// Create new shadow user
	const shadowEmail = `${athleteData.id}@strava.washed-up.club`;

	// Create user via Admin API
	const { data: user, error: userError } = await adminClient.auth.admin.createUser({
		email: shadowEmail,
		email_confirm: true, // Mark email as confirmed
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

	// Create profile record with user data
	// This is required because strava_connections references profile.id
	try {
		await db.insert(profileTable).values({
			id: user.user.id,
			firstname: athleteData.firstname,
			lastname: athleteData.lastname,
			username: athleteData.username,
			stravaAthleteId: athleteData.id,
			updatedAt: new Date()
		});
	} catch (profileError) {
		// Profile might already exist, or there might be a constraint issue
		// Log but don't fail - the connection insert will fail if there's a real problem
		console.warn('Profile creation warning:', profileError);
	}

	// Insert Strava connection record
	await db.insert(stravaConnectionsTable).values({
		userId: user.user.id,
		stravaAthleteId: athleteData.id,
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		expiresAt: new Date(tokens.expires_at * 1000),
		scope: 'activity:read_all,profile:read_all'
	});

	return user.user.id;
}

// Note: Session creation is now handled directly in the callback route
// This function is kept for potential future use but is not currently called

/**
 * Updates user profile data from Strava athlete data
 * @param userId - Supabase user ID
 * @param athleteData - Strava athlete profile data
 */
export async function updateUserProfile(
	userId: string,
	athleteData: StravaSummaryAthlete
): Promise<void> {
	await db
		.update(profileTable)
		.set({
			firstname: athleteData.firstname,
			lastname: athleteData.lastname,
			username: athleteData.username,
			stravaAthleteId: athleteData.id,
			updatedAt: new Date()
		})
		.where(eq(profileTable.id, userId));
}

/**
 * Gets the current user's Strava connection data
 * @param userId - Supabase user ID
 * @returns Strava connection record or null
 */
export async function getStravaConnection(userId: string) {
	const connection = await db
		.select()
		.from(stravaConnectionsTable)
		.where(eq(stravaConnectionsTable.userId, userId))
		.limit(1);

	return connection[0] || null;
}

/**
 * Gets user profile data from database
 * @param userId - Supabase user ID
 * @returns Profile record or null
 */
export async function getUserProfile(userId: string) {
	const profile = await db.select().from(profileTable).where(eq(profileTable.id, userId)).limit(1);

	return profile[0] || null;
}
