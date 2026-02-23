/**
 * Converts a snake_case string to camelCase.
 */
function snakeToCamel(str: string): string {
	return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Recursively converts object keys from snake_case to camelCase.
 * Use for API responses (e.g. Strava) before passing to front-end.
 */
export function keysToCamel<T>(obj: unknown): T {
	if (obj === null || typeof obj !== 'object') {
		return obj as T;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => keysToCamel(item)) as T;
	}

	return Object.fromEntries(
		Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
			snakeToCamel(k),
			keysToCamel(v)
		])
	) as T;
}
