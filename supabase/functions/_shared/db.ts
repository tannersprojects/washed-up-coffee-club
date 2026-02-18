import { drizzle } from 'npm:drizzle-orm@0.45.1/postgres-js';
import postgres from 'npm:postgres@3.4.8';
import * as schema from './schema.ts';

const SUPABASE_DB_URL = Deno.env.get('SUPABASE_DB_URL');

if (!SUPABASE_DB_URL) {
	console.error('SUPABASE_DB_URL is not set');
	throw new Error('SUPABASE_DB_URL is not set');
}

const client = postgres(SUPABASE_DB_URL, { prepare: false });
export const db = drizzle(client, { schema });
