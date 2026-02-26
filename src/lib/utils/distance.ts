import { DISTANCE_LABEL, DISTANCE_UNIT, type DistanceUnit } from '$lib/constants';

const METERS_PER_MILE = 1609.344;

export function metersToMiles(meters: number): number {
	return meters / METERS_PER_MILE;
}

export function metersToKm(meters: number): number {
	return meters / 1000;
}

export function milesToMeters(miles: number): number {
	return miles * METERS_PER_MILE;
}

export function kmToMeters(km: number): number {
	return km * 1000;
}

export function formatDistanceDisplay(meters: number, unit: DistanceUnit): string {
	const value = unit === DISTANCE_UNIT.MILES ? metersToMiles(meters) : metersToKm(meters);
	return `${value.toFixed(1)} ${DISTANCE_LABEL[unit]}`;
}
