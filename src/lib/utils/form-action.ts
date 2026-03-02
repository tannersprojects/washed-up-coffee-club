/**
 * Shape of data returned when a form action calls fail(status, data).
 * Used with use:enhance when result.type === 'failure'.
 */
export type FormActionFailureData = {
	error?: string;
};

/**
 * Extracts the error message from a form action result.
 * Returns undefined if result is not a failure or has no error.
 */
export function getFormActionError(result: {
	type: string;
	data?: unknown;
}): string | undefined {
	if (result.type !== 'failure') return undefined;
	return (result.data as FormActionFailureData | undefined)?.error;
}
