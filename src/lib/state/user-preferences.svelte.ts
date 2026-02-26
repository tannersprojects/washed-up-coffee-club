import { getContext, setContext } from 'svelte';
import { DISTANCE_UNIT, type DistanceUnit } from '$lib/constants';

export const USER_PREFERENCES_KEY = Symbol('USER_PREFERENCES');

export class UserPreferences {
	distanceUnit: DistanceUnit = $state(DISTANCE_UNIT.MILES);

	constructor() {}
}

export function setUserPreferencesContext(): UserPreferences {
	const prefs = new UserPreferences();
	return setContext<UserPreferences>(USER_PREFERENCES_KEY, prefs);
}

export function getUserPreferencesContext(): UserPreferences {
	return getContext<UserPreferences>(USER_PREFERENCES_KEY);
}
