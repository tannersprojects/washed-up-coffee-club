// Strava OAuth Token Exchange Response
export interface StravaTokenResponse {
	token_type: string;
	expires_at: number; // Unix timestamp
	expires_in: number; // Seconds until expiration
	access_token: string;
	refresh_token: string;
	athlete: StravaSummaryAthlete;
}

// Strava Summary Athlete (as returned in token response)
export interface StravaSummaryAthlete {
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
	premium: boolean; // Deprecated
	summit: boolean;
	created_at: string;
	updated_at: string;
	badge_type_id: number;
	weight: number;
	profile_medium: string;
	profile: string;
	friend: null;
	follower: null;
}

// Strava Summary Club Data (used in athlete profile)
export interface StravaSummaryClub {
	id: number;
	resource_state: number; // 1 -> "meta", 2 -> "summary", 3 -> "detail"
	name: string;
	profile_medium: string; // URL to 60x60 pixel profile picture
	cover_photo: string; // URL to ~1185x580 pixel cover photo
	cover_photo_small: string; // URL to ~360x176 pixel cover photo
	sport_type?: string; // Deprecated: 'cycling' | 'running' | 'triathlon' | 'other'
	activity_types?: string[]; // Activity types that count for the club (takes precedence over sport_type)
	city: string | null;
	state: string | null;
	country: string | null;
	private: boolean; // Whether the club is private
	member_count: number;
	featured: boolean;
	verified: boolean;
	url: string | null; // The club's vanity URL
}

// Strava Detailed Club Data (includes membership info when viewing as logged-in athlete)
export interface StravaDetailedClub {
	id: number;
	resource_state: number; // 1 -> "meta", 2 -> "summary", 3 -> "detail"
	name: string;
	profile_medium: string; // URL to 60x60 pixel profile picture
	cover_photo: string; // URL to ~1185x580 pixel cover photo
	cover_photo_small: string; // URL to ~360x176 pixel cover photo
	sport_type?: string; // Deprecated: 'cycling' | 'running' | 'triathlon' | 'other'
	activity_types?: string[]; // Activity types that count for the club (takes precedence over sport_type)
	city: string | null;
	state: string | null;
	country: string | null;
	private: boolean; // Whether the club is private
	member_count: number;
	featured: boolean;
	verified: boolean;
	url: string | null; // The club's vanity URL
	membership?: 'member' | 'pending'; // Membership status of logged-in athlete
	admin?: boolean; // Whether logged-in athlete is an administrator
	owner?: boolean; // Whether logged-in athlete is the owner
	following_count?: number; // Number of athletes in club that logged-in athlete follows
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
