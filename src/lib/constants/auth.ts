/**
 * Error messages for authentication failures
 * Maps error codes from OAuth callback to user-friendly messages
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
	oauth_denied: 'Authorization was denied. Please try again.',
	invalid_state: 'Security validation failed. Please try again.',
	missing_code: 'Authorization code missing. Please try again.',
	user_not_found: 'User account could not be found. Please try again.',
	session_failed: 'Failed to create session. Please try again.',
	token_extraction_failed: 'Failed to process authentication. Please try again.',
	session_set_failed: 'Failed to set session. Please try again.',
	unknown: 'An unknown error occurred. Please try again.'
};
