import type { SportType, WebhookObjectType, WebhookAspectType } from '$lib/constants/strava';

/** Strava webhook POST body. Matches structure in strava_webhook_logs (migration 0003). */
export interface StravaWebhookPayload {
	object_type: WebhookObjectType;
	aspect_type: WebhookAspectType;
	object_id: number;
	owner_id: number;
	subscription_id: number;
	event_time: number;
	updates?: Record<string, unknown>;
}

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

// --- Activity-related types (DetailedActivity and nested) ---

/** Minimal athlete reference (id, resource_state) used in activities, efforts, laps */
export interface StravaMetaAthlete {
	id: number;
	resource_state: number;
}

/** Minimal activity reference (id, resource_state) used in efforts, laps */
export interface StravaMetaActivity {
	id: number;
	resource_state: number;
}

/** [lat, lng] tuple */
export type StravaLatLng = [number, number];

/** Map with encoded polylines */
export interface StravaPolylineMap {
	id: string;
	polyline: string | null;
	resource_state: number;
	summary_polyline?: string;
}

/** Photo URLs by size (e.g. "100", "600") */
export interface StravaPhotoUrls {
	[key: string]: string;
}

/** Primary photo in a photos summary */
export interface StravaPrimaryPhoto {
	id: string | null;
	unique_id: string;
	urls: StravaPhotoUrls;
	source: number;
}

/** Photos summary for an activity */
export interface StravaPhotosSummary {
	primary: StravaPrimaryPhoto;
	use_primary_photo: boolean;
	count: number;
}

/** Gear (bike/shoes) summary */
export interface StravaSummaryGear {
	id: string;
	primary: boolean;
	name: string;
	resource_state: number;
	distance: number;
}

/** Summary segment (nested in DetailedSegmentEffort) */
export interface StravaSummarySegment {
	id: number;
	resource_state: number;
	name: string;
	activity_type: string;
	distance: number;
	average_grade: number;
	maximum_grade: number;
	elevation_high: number;
	elevation_low: number;
	start_latlng: StravaLatLng;
	end_latlng: StravaLatLng;
	climb_category: number;
	city: string;
	state: string;
	country: string;
	private: boolean;
	hazardous: boolean;
	starred: boolean;
}

/** Segment effort (athlete's attempt at a segment) */
export interface StravaDetailedSegmentEffort {
	id: number;
	resource_state: number;
	name: string;
	activity: StravaMetaActivity;
	athlete: StravaMetaAthlete;
	elapsed_time: number;
	moving_time: number;
	start_date: string;
	start_date_local: string;
	distance: number;
	start_index: number;
	end_index: number;
	average_cadence?: number;
	average_heartrate?: number;
	max_heartrate?: number;
	heartrate_opt_out?: boolean;
	device_watts?: boolean;
	average_watts?: number;
	segment: StravaSummarySegment;
	kom_rank: number | null;
	pr_rank: number | null;
	achievements: unknown[];
	hidden: boolean;
}

/** Split (e.g. per-km splits for runs) */
export interface StravaSplit {
	distance: number;
	elapsed_time: number;
	elevation_difference: number;
	moving_time: number;
	split: number;
	average_speed: number;
	pace_zone: number;
	average_heartrate?: number;
	max_heartrate?: number;
	average_grade_adjusted_speed?: number;
}

/** Lap within an activity */
export interface StravaLap {
	id: number;
	resource_state: number;
	name: string;
	activity: StravaMetaActivity;
	athlete: StravaMetaAthlete;
	elapsed_time: number;
	moving_time: number;
	start_date: string;
	start_date_local: string;
	distance: number;
	start_index: number;
	end_index: number;
	total_elevation_gain?: number;
	average_speed?: number;
	max_speed?: number;
	average_cadence?: number;
	average_heartrate?: number;
	max_heartrate?: number;
	device_watts?: boolean;
	average_watts?: number;
	lap_index: number;
	split: number;
}

/** Highlighted kudoer (athlete who gave kudos) */
export interface StravaHighlightedKudoser {
	destination_url: string;
	display_name: string;
	avatar_url: string;
	show_name: boolean;
}

/** Full activity response from GET /activities/{id} */
export interface StravaDetailedActivity {
	id: number;
	resource_state: number;
	external_id: string | null;
	upload_id: number | null;
	athlete: StravaMetaAthlete;
	name: string;
	distance: number;
	moving_time: number;
	elapsed_time: number;
	total_elevation_gain: number;
	elev_high?: number;
	elev_low?: number;
	type: string;
	sport_type: SportType;
	start_date: string;
	start_date_local: string;
	timezone: string;
	utc_offset?: number;
	start_latlng: StravaLatLng | null;
	end_latlng: StravaLatLng | null;
	achievement_count: number;
	kudos_count: number;
	comment_count: number;
	athlete_count: number;
	photo_count: number;
	total_photo_count: number;
	map: StravaPolylineMap | null;
	device_name: string | null;
	trainer: boolean;
	commute: boolean;
	manual: boolean;
	private: boolean;
	visibility?: string;
	flagged: boolean;
	workout_type: number | null;
	upload_id_str?: string;
	average_speed: number;
	max_speed: number;
	has_kudoed: boolean;
	hide_from_home: boolean;
	gear_id: string | null;
	kilojoules?: number;
	average_watts?: number;
	device_watts?: boolean;
	max_watts?: number;
	weighted_average_watts?: number;
	average_cadence?: number;
	average_heartrate?: number;
	max_heartrate?: number;
	average_temp?: number;
	has_heartrate?: boolean;
	pr_count?: number;
	suffer_score?: number | null;
	description: string | null;
	calories?: number;
	photos?: StravaPhotosSummary;
	gear?: StravaSummaryGear;
	segment_efforts?: StravaDetailedSegmentEffort[];
	embed_token?: string;
	splits_metric?: StravaSplit[];
	splits_standard?: StravaSplit[];
	laps?: StravaLap[];
	best_efforts?: StravaDetailedSegmentEffort[];
	partner_brand_tag?: string | null;
	highlighted_kudosers?: StravaHighlightedKudoser[];
	from_accepted_tag?: boolean;
	segment_leaderboard_opt_out?: boolean;
	leaderboard_opt_out?: boolean;
	location_city?: string | null;
	location_state?: string | null;
	location_country?: string | null;
}

// --- CamelCase variants (for front-end use) ---

/** Converts snake_case string to camelCase */
type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
	? `${T}${Capitalize<SnakeToCamelCase<U>>}`
	: S;

/** Recursively converts object keys from snake_case to camelCase */
export type CamelCaseKeys<T> = T extends (infer U)[]
	? CamelCaseKeys<U>[]
	: T extends object
		? { [K in keyof T as SnakeToCamelCase<string & K>]: CamelCaseKeys<T[K]> }
		: T;

/** Activity with camelCase keys for front-end use */
export type StravaDetailedActivityCamel = CamelCaseKeys<StravaDetailedActivity>;

/** Segment effort with camelCase keys for front-end use */
export type StravaDetailedSegmentEffortCamel = CamelCaseKeys<StravaDetailedSegmentEffort>;

/** Lap with camelCase keys for front-end use */
export type StravaLapCamel = CamelCaseKeys<StravaLap>;

/** Split with camelCase keys for front-end use */
export type StravaSplitCamel = CamelCaseKeys<StravaSplit>;

// Strava OAuth Error Response
export interface StravaErrorResponse {
	message: string;
	errors: Array<{
		resource: string;
		field: string;
		code: string;
	}>;
}
