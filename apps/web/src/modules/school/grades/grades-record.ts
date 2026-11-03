export type PeriodDates = { start: string; end: string };
export function periodState(period: PeriodDates, today: string) {
	return today < period.start
		? "upcoming"
		: today > period.end
			? "closed"
			: "open";
}
export function average(values: readonly (number | null | undefined)[]) {
	const captured = values.filter((value): value is number => value != null);
	return captured.length
		? Math.round((captured.reduce((a, b) => a + b, 0) / captured.length) * 10) /
				10
		: null;
}
export function situation(value: number | null, passing: number) {
	return value == null ? null : value >= passing ? "Aprueba" : "Reprueba";
}
export function periodRows<
	T extends {
		subject: string;
		values: Record<string, number | null | undefined>;
	},
>(rows: readonly T[], period: string) {
	return rows
		.map((row) => ({ ...row, value: row.values[period] ?? null }))
		.sort((a, b) => a.subject.localeCompare(b.subject, "es"));
}
