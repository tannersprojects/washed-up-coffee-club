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
