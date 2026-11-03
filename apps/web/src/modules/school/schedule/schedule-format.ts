/** es-MX date and time labels shared by the group schedule. */
const fmt = (date: string, options: Intl.DateTimeFormatOptions) =>
	new Intl.DateTimeFormat("es-MX", { ...options, timeZone: "UTC" }).format(
		new Date(`${date}T12:00:00Z`),
	);
/** "lun 2 nov" */
export const shortDate = (date: string) =>
	fmt(date, { weekday: "short", day: "numeric", month: "short" }).replace(
		/\./g,
		"",
	);
export const longDate = (date: string) =>
	fmt(date, { weekday: "long", day: "numeric", month: "long" });
export function weekTitle(first: string, last: string) {
	const sameMonth = first.slice(0, 7) === last.slice(0, 7);
	const start = fmt(
		first,
		sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" },
	);
	return `${start} – ${fmt(last, { day: "numeric", month: "short", year: "numeric" })}`.replace(
		/\./g,
		"",
	);
}
export function isoWeek(date: string) {
	const d = new Date(`${date}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
	const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
	return (
		1 +
		Math.round(
			((d.getTime() - firstThursday.getTime()) / 86400000 -
				3 +
				((firstThursday.getUTCDay() + 6) % 7)) /
				7,
		)
	);
}
export function zoneName(timezone: string) {
	try {
		const name = new Intl.DateTimeFormat("es-MX", {
			timeZone: timezone,
			timeZoneName: "longGeneric",
		})
			.formatToParts(new Date())
			.find((part) => part.type === "timeZoneName")?.value;
		return name ? name.charAt(0).toUpperCase() + name.slice(1) : timezone;
	} catch {
		return timezone;
	}
}
export function hash(value: string) {
	let h = 0;
	for (const char of value) h = (h * 31 + char.charCodeAt(0)) | 0;
	return Math.abs(h);
}
/** "07:30" → "7:30" */
export const hm = (time: string) => time.replace(/^0(\d)/, "$1");
export const coverWords = { substitute: "Suplente", teacher: "Cubre" };
