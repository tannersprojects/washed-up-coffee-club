const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

/**
 * Formats the time remaining until a target date.
 * @param endDate - The target date (Date object or ISO string)
 * @returns "DDd HH:MM:SS" when 1+ days remain, "HH:MM:SS" when under 24h, "00:00:00" if expired
 */
export function formatTimeRemaining(endDate: Date | string): string {
	const diff = getTimeRemainingMs(endDate);

	if (diff <= 0) {
		return '00:00:00';
	}

	const d = Math.floor(diff / MS_PER_DAY);
	const remainder = diff % MS_PER_DAY;
	const h = Math.floor(remainder / MS_PER_HOUR);
	const m = Math.floor((remainder % MS_PER_HOUR) / MS_PER_MINUTE);
	const s = Math.floor((remainder % MS_PER_MINUTE) / MS_PER_SECOND);

	const hhmmss = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	return d > 0 ? `${d}d ${hhmmss}` : hhmmss;
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
