import type { Cookies } from '@sveltejs/kit';

export const load = async ({
	locals: { safeGetSession, profile },
	cookies
}: {
	locals: App.Locals;
	cookies: Cookies;
}) => {
	const { session, user } = await safeGetSession();

	return {
		session,
		user,
		profile,
		cookies: cookies.getAll()
	};
};
