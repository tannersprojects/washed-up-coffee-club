export const DISTANCE_UNIT = {
	MILES: 'mi' as const,
	KILOMETERS: 'km' as const
} as const;

export type DistanceUnit = (typeof DISTANCE_UNIT)[keyof typeof DISTANCE_UNIT];

export const DISTANCE_LABEL: Record<DistanceUnit, string> = {
	[DISTANCE_UNIT.MILES]: 'mi',
	[DISTANCE_UNIT.KILOMETERS]: 'km'
} as const;

export const PACE_UNIT_LABEL: Record<DistanceUnit, string> = {
	[DISTANCE_UNIT.MILES]: '/mi',
	[DISTANCE_UNIT.KILOMETERS]: '/km'
} as const;

export const LONG_DISTANCE_LABEL = {
	[DISTANCE_UNIT.MILES]: 'Total miles',
	[DISTANCE_UNIT.KILOMETERS]: 'Total km'
} as const satisfies Record<DistanceUnit, string>;

export type LongDistanceLabel = (typeof LONG_DISTANCE_LABEL)[DistanceUnit];
