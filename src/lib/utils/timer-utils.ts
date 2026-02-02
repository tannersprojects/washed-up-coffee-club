/**
 * Formats the time remaining until a target date as "HH:MM:SS"
 * @param endDate - The target end date (Date object or ISO string)
 * @returns Formatted time string "HH:MM:SS" or "00:00:00" if expired
 */
export function formatTimeRemaining(endDate: Date | string): string {
	const diff = getTimeRemainingMs(endDate);

	if (diff <= 0) {
		return '00:00:00';
	}

	const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	const s = Math.floor((diff % (1000 * 60)) / 1000);

	return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Gets the time remaining in milliseconds until a target date
 * @param endDate - The target end date (Date object or ISO string)
 * @returns Milliseconds remaining (negative if expired)
 */
export function getTimeRemainingMs(endDate: Date | string): number {
	const now = new Date();
	const end = new Date(endDate);
	return end.getTime() - now.getTime();
}
