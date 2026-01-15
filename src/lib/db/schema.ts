import {
	pgTable,
	uuid,
	text,
	timestamp,
	bigint,
	integer,
	boolean,
	index
} from 'drizzle-orm/pg-core';

// Reference to Supabase auth.users (not managed by Drizzle, just for FK)
export const profileTable = pgTable(
	'profile',
	{
		id: uuid('id').primaryKey(),
		firstname: text('firstname').notNull(),
		lastname: text('lastname').notNull(),
		username: text('username').notNull(),
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

export const memoriesTable = pgTable(
	'memories',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		src: text('src').notNull(),
		caption: text('caption').notNull(),
		sortOrder: integer('sort_order').notNull().default(0),
		isActive: boolean('is_active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [index('idx_memories_sort_order').on(table.sortOrder)]
);

export const routineSchedulesTable = pgTable(
	'routine_schedules',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		day: text('day').notNull(),
		time: text('time').notNull(),
		location: text('location').notNull(),
		accentColor: text('accent_color').notNull(),
		description: text('description').notNull(),
		sortOrder: integer('sort_order').notNull().default(0),
		isActive: boolean('is_active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [index('idx_routine_schedules_sort_order').on(table.sortOrder)]
);
