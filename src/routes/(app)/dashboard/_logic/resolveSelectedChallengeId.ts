import type { DashboardChallenge } from '$lib/types/dashboard.js';
import { DASHBOARD_QUERY_PARAM } from '$lib/constants';

/**
 * Resolves which challenge ID to select.
 * Trusts that `challenges` is pre-sorted (latest startDate first) so
 * challenges[0] is the default.
 */
export function resolveSelectedChallengeId(
	challenges: DashboardChallenge[],
	param: string | null
): string | null {
	if (challenges.length === 0) return null;

	const defaultId = challenges[0]!.id;

	if (param && challenges.some((c) => c.id === param)) {
		return param;
	}

	return defaultId;
}

/**
 * Returns a /dashboard href with the ?challenge= param set to `challengeId`,
 * preserving any other existing search params.
 */
export function buildDashboardChallengeHref(
	pathname: string,
	search: string,
	challengeId: string
): string {
	const url = new URL(pathname + search, 'http://local');
	url.searchParams.set(DASHBOARD_QUERY_PARAM.challenge, challengeId);
	return `${url.pathname}${url.search}`;
}
