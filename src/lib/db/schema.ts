import {
	CHALLENGE_TYPE,
	CHALLENGE_STATUS,
	PARTICIPANT_STATUS,
	PROFILE_ROLE,
	RANKING_METRIC,
	RANKING_METRIC_VALUES,
	WEBHOOK_OBJECT_TYPE,
	WEBHOOK_ASPECT_TYPE,
	WEBHOOK_STATUS,
	LANDING_COPY_SECTION,
	LANDING_COPY_KEY
} from '$lib/constants';

import {
	pgTable,
	uuid,
	jsonb,
	text,
	timestamp,
	bigint,
	integer,
	boolean,
	index,
	pgEnum,
	real
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import type {
	ChallengeActivitySnapshot,
	ChallengeBestEffortsSnapshot,
	ChallengeLapsSnapshot,
	ChallengeSplitsSnapshot
} from '$lib/types/challenge-ranking';

// --- ENUMS ---
// Enforcing strict types for logic branching

export const profileRoleEnum = pgEnum('profile_role', [PROFILE_ROLE.ADMIN, PROFILE_ROLE.USER]);

// 1. Challenge Type: Defines how we calculate the winner
// 'best_effort' = Single best run (e.g. Fastest 5k)
// 'segment_race' = Best time on specific segment
// 'cumulative' = Total volume (e.g. 50 miles in Jan)
export const challengeTypeEnum = pgEnum('challenge_type', [
	CHALLENGE_TYPE.BEST_EFFORT,
	CHALLENGE_TYPE.SEGMENT_RACE,
	CHALLENGE_TYPE.CUMULATIVE
]);

export const challengeRankingMetricEnum = pgEnum('challenge_ranking_metric', RANKING_METRIC_VALUES);

// 2. Challenge Status: Lifecycle of the event
export const challengeStatusEnum = pgEnum('challenge_status', [
	CHALLENGE_STATUS.UPCOMING,
	CHALLENGE_STATUS.ACTIVE,
	CHALLENGE_STATUS.COMPLETED
]);

// 3. Participant Status: The user's journey in a specific challenge
export const participantStatusEnum = pgEnum('participant_status', [
	PARTICIPANT_STATUS.REGISTERED,
	PARTICIPANT_STATUS.IN_PROGRESS,
	PARTICIPANT_STATUS.COMPLETED,
	PARTICIPANT_STATUS.DID_NOT_FINISH
]);

// 4. Webhook Object Type: The Strava resource that triggered the event
export const webhookObjectTypeEnum = pgEnum('webhook_object_type', [
	WEBHOOK_OBJECT_TYPE.ACTIVITY,
	WEBHOOK_OBJECT_TYPE.ATHLETE
]);

// 5. Webhook Aspect Type: What happened to the resource
export const webhookAspectTypeEnum = pgEnum('webhook_aspect_type', [
	WEBHOOK_ASPECT_TYPE.CREATE,
	WEBHOOK_ASPECT_TYPE.UPDATE,
	WEBHOOK_ASPECT_TYPE.DELETE
]);

// 6. Webhook Status: Processing lifecycle of the webhook event
export const webhookStatusEnum = pgEnum('webhook_status', [
	WEBHOOK_STATUS.PENDING,
	WEBHOOK_STATUS.PROCESSED,
	WEBHOOK_STATUS.ERROR
]);

// 7. Landing Copy Section: Groups editable copy by landing page section
export const landingCopySectionEnum = pgEnum(
	'landing_copy_section',
	Object.values(LANDING_COPY_SECTION) as [string, ...string[]]
);

// 8. Landing Copy Key: The valid set of editable copy field identifiers
export const landingCopyKeyEnum = pgEnum(
	'landing_copy_key',
	Object.values(LANDING_COPY_KEY) as [string, ...string[]]
);

// Reference to Supabase auth.users (not managed by Drizzle, just for FK)
export const profileTable = pgTable(
	'profile',
	{
		id: uuid('id').primaryKey(),
		firstname: text('firstname').notNull(),
		lastname: text('lastname').notNull(),
		username: text('username').notNull(),
		stravaAthleteId: bigint('strava_athlete_id', { mode: 'number' }).unique(),
		role: profileRoleEnum('role').notNull().default(PROFILE_ROLE.USER),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [index('idx_profile_strava_athlete_id').on(table.stravaAthleteId)]
);

export const stravaConnectionsTable = pgTable(
	'strava_connections',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		profileId: uuid('profile_id')
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
	(table) => [index('idx_strava_connections_profile_id').on(table.profileId)]
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

export const challengesTable = pgTable('challenges', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: text('title').notNull(),
	description: text('description').notNull().default(''),
	type: challengeTypeEnum('type').notNull().default(CHALLENGE_TYPE.CUMULATIVE),
	rankingMetric: challengeRankingMetricEnum('ranking_metric')
		.notNull()
		.default(RANKING_METRIC.NONE),
	goalDistance: real('goal_distance'),
	segmentId: bigint('segment_id', { mode: 'number' }),
	startDate: timestamp('start_date', { withTimezone: true }).notNull(),
	endDate: timestamp('end_date', { withTimezone: true }).notNull(),
	status: challengeStatusEnum('status').notNull().default(CHALLENGE_STATUS.UPCOMING),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const challengeParticipantsTable = pgTable(
	'challenge_participants',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		challengeId: uuid('challenge_id')
			.references(() => challengesTable.id, { onDelete: 'cascade' })
			.notNull(),
		profileId: uuid('profile_id')
			.references(() => profileTable.id, { onDelete: 'cascade' })
			.notNull(),

		status: participantStatusEnum('status').default(PARTICIPANT_STATUS.REGISTERED),
		joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),

		// THE CACHED TOTAL
		// For 'cumulative': Sum of value_distance from contributions.
		// For 'best_effort': best run distance for highlighted activity.
		// For 'segment_race': segment distance for highlighted best segment effort.
		resultDistance: real('result_distance'),
		resultMovingTimeTotal: integer('result_moving_time_total'),
		rankingValueSeconds: integer('ranking_value_seconds'),
		rankingComputedAt: timestamp('ranking_computed_at', { withTimezone: true }),

		// For 'best_effort', this links to the winning activity.
		// For 'cumulative', this could link to the *latest* activity that pushed them over the goal.
		highlightActivityId: bigint('highlight_activity_id', { mode: 'number' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		index('idx_participant_challenge_profile').on(table.challengeId, table.profileId),
		index('idx_participant_result_distance').on(table.challengeId, table.resultDistance),
		index('idx_participant_ranking_value').on(table.challengeId, table.rankingValueSeconds)
	]
);

// 3. CHALLENGE CONTRIBUTIONS TABLE (The Evidence)
// NEW: This tracks every individual run that counts towards a challenge.
export const challengeContributionsTable = pgTable(
	'challenge_contributions',
	{
		id: uuid('id').defaultRandom().primaryKey(),

		// Link to the Participant Entry (not just the user, but the user-in-this-challenge)
		participantId: uuid('participant_id')
			.references(() => challengeParticipantsTable.id, { onDelete: 'cascade' })
			.notNull(),

		// The specific Strava Activity
		stravaActivityId: bigint('strava_activity_id', { mode: 'number' }).notNull(),
		activityName: text('activity_name'), // Useful for UI ("Morning Run")

		// The value this specific run contributed (one of the two is set per challenge type)
		distance: real('distance'),
		movingTime: integer('moving_time'),
		elapsedTime: integer('elapsed_time'),
		bestEfforts: jsonb('best_efforts').$type<ChallengeBestEffortsSnapshot | null>(),
		splitsMetric: jsonb('splits_metric').$type<ChallengeSplitsSnapshot | null>(),
		splitsStandard: jsonb('splits_standard').$type<ChallengeSplitsSnapshot | null>(),
		laps: jsonb('laps').$type<ChallengeLapsSnapshot | null>(),
		activitySnapshot: jsonb('activity_snapshot').$type<ChallengeActivitySnapshot | null>(),

		// Verification
		isValid: boolean('is_valid').default(true), // Allows you to "disqualify" a specific run without deleting it

		occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		// Ensure we don't accidentally double-count the same Strava activity for the same participant
		index('idx_contribution_unique').on(table.participantId, table.stravaActivityId)
	]
);

// --- STRAVA WEBHOOK LOGS TABLE ---
// Stores raw Strava webhook events for audit and async processing.
// The DB trigger on INSERT fires an Edge Function via pg_net.
export const stravaWebhookLogsTable = pgTable('strava_webhook_logs', {
	id: uuid('id').defaultRandom().primaryKey(),
	payload: jsonb('payload').notNull(),
	stravaAthleteId: bigint('strava_athlete_id', { mode: 'number' }),
	objectType: webhookObjectTypeEnum('object_type'),
	objectId: bigint('object_id', { mode: 'number' }),
	aspectType: webhookAspectTypeEnum('aspect_type'),
	eventTime: integer('event_time'),
	status: webhookStatusEnum('status').default(WEBHOOK_STATUS.PENDING),
	errorMessage: text('error_message'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const landingCopyTable = pgTable('landing_copy', {
	key: landingCopyKeyEnum('key').primaryKey(),
	section: landingCopySectionEnum('section').notNull(),
	label: text('label').notNull(),
	value: text('value').notNull(),
	sortOrder: integer('sort_order').notNull().default(0),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// --- RELATIONS ---

export const profileRelations = relations(profileTable, ({ many }) => ({
	stravaConnections: many(stravaConnectionsTable),
	challengeParticipants: many(challengeParticipantsTable)
}));

export const stravaConnectionsRelations = relations(stravaConnectionsTable, ({ one }) => ({
	profile: one(profileTable, {
		fields: [stravaConnectionsTable.profileId],
		references: [profileTable.id]
	})
}));

export const challengesRelations = relations(challengesTable, ({ many }) => ({
	participants: many(challengeParticipantsTable)
}));

export const challengeParticipantsRelations = relations(
	challengeParticipantsTable,
	({ one, many }) => ({
		challenge: one(challengesTable, {
			fields: [challengeParticipantsTable.challengeId],
			references: [challengesTable.id]
		}),
		profile: one(profileTable, {
			fields: [challengeParticipantsTable.profileId],
			references: [profileTable.id]
		}),
		contributions: many(challengeContributionsTable)
	})
);

export const challengeContributionsRelations = relations(
	challengeContributionsTable,
	({ one }) => ({
		participant: one(challengeParticipantsTable, {
			fields: [challengeContributionsTable.participantId],
			references: [challengeParticipantsTable.id]
		})
	})
);

// --- TYPE EXPORTS ---
// Export inferred types from Drizzle schema for use throughout the application

export type Profile = InferSelectModel<typeof profileTable>;
export type Memory = InferSelectModel<typeof memoriesTable>;
export type RoutineSchedule = InferSelectModel<typeof routineSchedulesTable>;
export type Challenge = InferSelectModel<typeof challengesTable>;
export type ChallengeParticipant = InferSelectModel<typeof challengeParticipantsTable>;
export type ChallengeContribution = InferSelectModel<typeof challengeContributionsTable>;
export type StravaConnection = InferSelectModel<typeof stravaConnectionsTable>;
export type StravaWebhookLog = InferSelectModel<typeof stravaWebhookLogsTable>;
export type LandingCopy = InferSelectModel<typeof landingCopyTable>;
