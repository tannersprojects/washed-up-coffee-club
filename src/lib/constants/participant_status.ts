export const PARTICIPANT_STATUS = {
	REGISTERED: 'registered' as const,
	IN_PROGRESS: 'in_progress' as const,
	COMPLETED: 'completed' as const,
	DID_NOT_FINISH: 'did_not_finish' as const
} as const;

export type ParticipantStatus = (typeof PARTICIPANT_STATUS)[keyof typeof PARTICIPANT_STATUS];
