// TODO(challenge-ranking): Revisit whether shared split matching tolerance should remain 1%.
export const DISTANCE_TOLERANCE_RATIO = 0.01;

export function sumDistances(contributions: Array<{ distance: number | null }>): number {
	return contributions.reduce((acc, c) => acc + (c.distance ?? 0), 0);
}

export function sumMovingTimes(contributions: Array<{ movingTime: number | null }>): number {
	return contributions.reduce((acc, c) => acc + (c.movingTime ?? 0), 0);
}

export function sumElapsedTimes(contributions: Array<{ elapsedTime: number | null }>): number {
	return contributions.reduce((acc, c) => acc + (c.elapsedTime ?? 0), 0);
}

export function getPreferredTime(
	movingTime: number | null | undefined,
	elapsedTime: number | null | undefined
): number | null {
	if (movingTime != null && movingTime > 0) return movingTime;
	if (elapsedTime != null && elapsedTime > 0) return elapsedTime;
	return null;
}
