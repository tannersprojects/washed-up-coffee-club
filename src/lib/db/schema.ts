import { pgTable, uuid, text, timestamp, bigint, index } from 'drizzle-orm/pg-core';

// Reference to Supabase auth.users (not managed by Drizzle, just for FK)
export const profileTable = pgTable(
	'profile',
	{
		id: uuid('id').primaryKey(),
		firstname: text('firstname'),
		lastname: text('lastname'),
		username: text('username'),
		stravaAthleteId: bigint('strava_athlete_id', { mode: 'number' }).unique(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [index('idx_profile_strava_athlete_id').on(table.stravaAthleteId)]
);

export const stravaConnectionsTable = pgTable(
	'strava_connections',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => profileTable.id, { onDelete: 'cascade' }),
		stravaAthleteId: bigint('strava_athlete_id', { mode: 'number' }).notNull().unique(),
		accessToken: text('access_token').notNull(),
		refreshToken: text('refresh_token').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		scope: text('scope').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [index('idx_strava_connections_user_id').on(table.userId)]
);
