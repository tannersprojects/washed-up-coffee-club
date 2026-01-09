import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw redirect(302, '/login');
	}

	return {
		session,
		user,
		profile: locals.profile
	};
};
