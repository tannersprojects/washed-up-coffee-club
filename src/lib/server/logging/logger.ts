import { env } from '$env/dynamic/private';
import pino, { type Logger, type LoggerOptions } from 'pino';

const SERVICE_NAME = 'washed-up-coffee-club';

function getLogLevel(): string {
	const raw = env.LOG_LEVEL ?? process.env.LOG_LEVEL;
	if (typeof raw === 'string' && raw.length > 0) {
		return raw;
	}
	return 'info';
}

function getEnvLabel(): string {
	return process.env.NODE_ENV ?? 'development';
}

const redactPaths: string[] = [
	'accessToken',
	'*.accessToken',
	'**.*.accessToken',
	'refreshToken',
	'*.refreshToken',
	'**.*.refreshToken',
	'authorization',
	'*.authorization',
	'headers.authorization',
	'*.headers.authorization',
	'req.headers.authorization',
	'cookie',
	'*.cookie',
	'headers.cookie',
	'*.headers.cookie',
	'req.headers.cookie'
];

const baseOptions: LoggerOptions = {
	level: getLogLevel(),
	base: {
		service: SERVICE_NAME,
		env: getEnvLabel()
	},
	redact: {
		paths: redactPaths,
		censor: '[Redacted]'
	}
};

export const logger: Logger = pino(baseOptions);

export function createChildLogger(bindings: Record<string, unknown>): Logger {
	return logger.child(bindings);
}

export type SerializedError = {
	name: string;
	message: string;
	stack?: string;
};

export function serializeError(err: unknown): SerializedError {
	if (err instanceof Error) {
		return {
			name: err.name,
			message: err.message,
			...(err.stack !== undefined ? { stack: err.stack } : {})
		};
	}
	return {
		name: 'Unknown',
		message: typeof err === 'string' ? err : JSON.stringify(err)
	};
}
