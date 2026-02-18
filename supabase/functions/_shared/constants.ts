export const PROFILE_ROLE = {
	ADMIN: 'admin' as const,
	USER: 'user' as const
} as const;

export type ProfileRole = (typeof PROFILE_ROLE)[keyof typeof PROFILE_ROLE];

export const CHALLENGE_STATUS = {
	UPCOMING: 'upcoming' as const,
	ACTIVE: 'active' as const,
	COMPLETED: 'completed' as const
} as const;

export type ChallengeStatus = (typeof CHALLENGE_STATUS)[keyof typeof CHALLENGE_STATUS];

export const CHALLENGE_TYPE = {
	BEST_EFFORT: 'best_effort' as const,
	SEGMENT_RACE: 'segment_race' as const,
	CUMULATIVE: 'cumulative' as const
} as const;

export type ChallengeType = (typeof CHALLENGE_TYPE)[keyof typeof CHALLENGE_TYPE];

export const PARTICIPANT_STATUS = {
	REGISTERED: 'registered' as const,
	IN_PROGRESS: 'in_progress' as const,
	COMPLETED: 'completed' as const,
	DID_NOT_FINISH: 'did_not_finish' as const
} as const;

export type ParticipantStatus = (typeof PARTICIPANT_STATUS)[keyof typeof PARTICIPANT_STATUS];

export const WEBHOOK_OBJECT_TYPE = {
	ACTIVITY: 'activity' as const,
	ATHLETE: 'athlete' as const
} as const;

export type WebhookObjectType = (typeof WEBHOOK_OBJECT_TYPE)[keyof typeof WEBHOOK_OBJECT_TYPE];

export const WEBHOOK_ASPECT_TYPE = {
	CREATE: 'create' as const,
	UPDATE: 'update' as const,
	DELETE: 'delete' as const
} as const;

export type WebhookAspectType = (typeof WEBHOOK_ASPECT_TYPE)[keyof typeof WEBHOOK_ASPECT_TYPE];

export const WEBHOOK_STATUS = {
	PENDING: 'pending' as const,
	PROCESSED: 'processed' as const,
	ERROR: 'error' as const
} as const;

export type WebhookStatus = (typeof WEBHOOK_STATUS)[keyof typeof WEBHOOK_STATUS];
