export const WEBHOOK_OBJECT_TYPE = {
	ACTIVITY: 'activity' as const,
	ATHLETE: 'athlete' as const
} as const;

export type WebhookObjectType = (typeof WEBHOOK_OBJECT_TYPE)[keyof typeof WEBHOOK_OBJECT_TYPE];

export const WEBHOOK_ASPECT_TYPE = {
	CREATE: 'create' as const,
	UPDATE: 'update' as const,
	DELETE: 'delete' as const
} as const;

export type WebhookAspectType = (typeof WEBHOOK_ASPECT_TYPE)[keyof typeof WEBHOOK_ASPECT_TYPE];

export const WEBHOOK_STATUS = {
	PENDING: 'pending' as const,
	PROCESSED: 'processed' as const,
	ERROR: 'error' as const
} as const;

export type WebhookStatus = (typeof WEBHOOK_STATUS)[keyof typeof WEBHOOK_STATUS];

export const STRAVA_SPORT_TYPE = {
	ALPINE_SKI: 'AlpineSki' as const,
	BACKCOUNTRY_SKI: 'BackcountrySki' as const,
	BADMINTON: 'Badminton' as const,
	CANOEING: 'Canoeing' as const,
	CROSSFIT: 'Crossfit' as const,
	EBIKE_RIDE: 'EBikeRide' as const,
	ELLIPTICAL: 'Elliptical' as const,
	EMOUNTAIN_BIKE_RIDE: 'EMountainBikeRide' as const,
	GOLF: 'Golf' as const,
	GRAVEL_RIDE: 'GravelRide' as const,
	HANDCYCLE: 'Handcycle' as const,
	HIGH_INTENSITY_INTERVAL_TRAINING: 'HighIntensityIntervalTraining' as const,
	HIKE: 'Hike' as const,
	ICE_SKATE: 'IceSkate' as const,
	INLINE_SKATE: 'InlineSkate' as const,
	KAYAKING: 'Kayaking' as const,
	KITESURF: 'Kitesurf' as const,
	MOUNTAIN_BIKE_RIDE: 'MountainBikeRide' as const,
	NORDIC_SKI: 'NordicSki' as const,
	PICKLEBALL: 'Pickleball' as const,
	PILATES: 'Pilates' as const,
	RACQUETBALL: 'Racquetball' as const,
	RIDE: 'Ride' as const,
	ROCK_CLIMBING: 'RockClimbing' as const,
	ROLLER_SKI: 'RollerSki' as const,
	ROWING: 'Rowing' as const,
	RUN: 'Run' as const,
	SAIL: 'Sail' as const,
	SKATEBOARD: 'Skateboard' as const,
	SNOWBOARD: 'Snowboard' as const,
	SNOWSHOE: 'Snowshoe' as const,
	SOCCER: 'Soccer' as const,
	SQUASH: 'Squash' as const,
	STAIR_STEPPER: 'StairStepper' as const,
	STAND_UP_PADDLING: 'StandUpPaddling' as const,
	SURFING: 'Surfing' as const,
	SWIM: 'Swim' as const,
	TABLE_TENNIS: 'TableTennis' as const,
	TENNIS: 'Tennis' as const,
	TRAIL_RUN: 'TrailRun' as const,
	VELOMOBILE: 'Velomobile' as const,
	VIRTUAL_RIDE: 'VirtualRide' as const,
	VIRTUAL_ROW: 'VirtualRow' as const,
	VIRTUAL_RUN: 'VirtualRun' as const,
	WALK: 'Walk' as const,
	WEIGHT_TRAINING: 'WeightTraining' as const,
	WHEELCHAIR: 'Wheelchair' as const,
	WINDSURF: 'Windsurf' as const,
	WORKOUT: 'Workout' as const,
	YOGA: 'Yoga' as const
} as const;

export type SportType = (typeof STRAVA_SPORT_TYPE)[keyof typeof STRAVA_SPORT_TYPE];

/** Sport types that count as runs for distance-based challenges */
export const RUN_SPORT_TYPES = [
	STRAVA_SPORT_TYPE.RUN,
	STRAVA_SPORT_TYPE.VIRTUAL_RUN,
	STRAVA_SPORT_TYPE.TRAIL_RUN
] as const;

export type RunSportType = (typeof RUN_SPORT_TYPES)[number];
