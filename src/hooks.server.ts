import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { requestLoggingHandle, supabaseHandle, profileHandle } from '$lib/server/hooks';

export const handle: Handle = sequence(requestLoggingHandle, supabaseHandle, profileHandle);
