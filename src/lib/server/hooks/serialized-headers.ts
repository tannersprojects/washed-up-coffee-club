/**
 * Headers allowed through to the client when serializing the response (SSR).
 * Matches previous inline `filterSerializedResponseHeaders` in the profile handle.
 */
export function supabaseSerializedResponseHeadersFilter(name: string): boolean {
	return name === 'content-range' || name === 'x-supabase-api-version';
}
