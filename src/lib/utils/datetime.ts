import { DateTime } from 'luxon';

const APP_TIMEZONE = 'America/New_York';
const DATETIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm";

/**
 * Parses a datetime-local string as Eastern Time and converts to UTC Date.
 * Use for form values from admin challenge date inputs.
 */
export function parseEasternToUtc(dateStr: string): Date | null {
	const dt = DateTime.fromFormat(dateStr, DATETIME_LOCAL_FORMAT, {
		zone: APP_TIMEZONE
	});
	return dt.isValid ? dt.toUTC().toJSDate() : null;
}

/**
 * Formats a Date for user-facing display (e.g. "Feb 20, 2026") in Eastern Time.
 */
export function formatDate(date: Date | string): string {
	return DateTime.fromJSDate(new Date(date), { zone: 'utc' })
		.setZone(APP_TIMEZONE)
		.toLocaleString(DateTime.DATE_MED);
}

/**
 * Formats a UTC Date for datetime-local input value in Eastern Time.
 * Use when populating admin challenge date inputs.
 */
export function formatDatetimeForInput(d: Date): string {
	return DateTime.fromJSDate(d, { zone: 'utc' })
		.setZone(APP_TIMEZONE)
		.toFormat(DATETIME_LOCAL_FORMAT);
}

/**
 * Formats a challenge date range for the list view: "Feb 20 - Feb 21" or "Active" if currently within the range.
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
	const start = DateTime.fromJSDate(new Date(startDate), { zone: 'utc' });
	const end = DateTime.fromJSDate(new Date(endDate), { zone: 'utc' });
	const now = DateTime.now();

	if (start <= now && end > now) {
		return 'Active';
	}

	const startInEastern = start.setZone(APP_TIMEZONE);
	const endInEastern = end.setZone(APP_TIMEZONE);
	return `${startInEastern.toFormat('MMM d')} - ${endInEastern.toFormat('MMM d')}`;
}
