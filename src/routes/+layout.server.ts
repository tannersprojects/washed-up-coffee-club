export const load = async ({ locals: { safeGetSession, profile }, cookies }) => {
	const { session, user } = await safeGetSession();

	return {
		session,
		user,
		profile,
		cookies: cookies.getAll()
	};
};
