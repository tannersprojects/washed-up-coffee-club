import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();

	// Redirect to dashboard if already logged in
	if (session) {
		throw redirect(302, '/dashboard');
	}

	return {
		session: null
	};
};
