import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { profileHandle } from '$lib/server/hooks/profile';
import { requestLoggingHandle } from '$lib/server/hooks/request-logging';
import { supabaseHandle } from '$lib/server/hooks/supabase';

export const handle: Handle = sequence(requestLoggingHandle, supabaseHandle, profileHandle);
