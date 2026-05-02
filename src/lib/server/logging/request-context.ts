import type { Logger } from 'pino';
import { createChildLogger } from './logger';

const REQUEST_ID_HEADER = 'x-request-id';

function trimHeader(value: string | null): string | null {
	if (value === null) {
		return null;
	}
	const t = value.trim();
	return t.length > 0 ? t : null;
}

/**
 * Prefer inbound `x-request-id`; otherwise generate a new UUID.
 */
export function getOrCreateRequestId(request: Request): string {
	const fromHeader = trimHeader(request.headers.get(REQUEST_ID_HEADER));
	if (fromHeader !== null) {
		return fromHeader;
	}
	return crypto.randomUUID();
}

/**
 * Request-scoped child logger with baseline correlation fields.
 */
export function createRequestLogger(requestId: string, method: string, path: string): Logger {
	return createChildLogger({
		requestId,
		method,
		path
	});
}
