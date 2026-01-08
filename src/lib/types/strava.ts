// Strava OAuth Token Exchange Response
export interface StravaTokenResponse {
	access_token: string;
	refresh_token: string;
	expires_at: number; // Unix timestamp
	expires_in: number; // Seconds until expiration
	token_type: string;
	athlete: StravaAthlete;
}

// Strava Athlete Profile Data
export interface StravaAthlete {
	id: number;
	username: string | null;
	resource_state: number;
	firstname: string;
	lastname: string;
	bio: string | null;
	city: string | null;
	state: string | null;
	country: string | null;
	sex: 'M' | 'F' | null;
	premium: boolean;
	summit: boolean;
	created_at: string;
	updated_at: string;
	badge_type_id: number;
	weight: number | null;
	profile_medium: string;
	profile: string;
	friend: null;
	follower: null;
}

// Strava OAuth Error Response
export interface StravaErrorResponse {
	message: string;
	errors: Array<{
		resource: string;
		field: string;
		code: string;
	}>;
}
