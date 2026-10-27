import { attendanceStatus, rangeDays } from "./group-table-helpers";
import type { State } from "./workflows";

export type AttendanceQuery = {
	cycle: string;
	date: string;
	mode: string;
	today: string;
	grade?: string;
	shift?: string;
};
function summarize(buckets: Map<string, State["events"]>) {
	let present = 0,
		absent = 0,
		review = 0;
	for (const events of buckets.values()) {
		const status = attendanceStatus(events);
		if (status === "Entrada y salida" || status === "Entrada sin salida")
			present++;
		else if (status === "Inasistencia explícita") absent++;
		else review++;
	}
	const confirmed = present + absent;
	const recorded = confirmed + review;
	return {
		present,
		absent,
		review,
		recorded,
		rate: confirmed ? (present / confirmed) * 100 : null,
		coverage: recorded ? (confirmed / recorded) * 100 : null,
	};
}
export function summarizeAttendance(s: State, q: AttendanceQuery) {
	const cycle = s.cycles.find((c) => c.id === q.cycle);
	const groups = s.groups.filter(
		(g) =>
			cycle &&
			g.cycle === cycle.id &&
			(!q.grade || g.grade === q.grade) &&
			(!q.shift || (g.shift || s.school.shift) === q.shift),
	);
	// Calendar holidays are visual annotations; only exceptions cancel classes.
	const excluded = new Set(s.exceptions.map((item) => item.date));
	const days = rangeDays(q.date, q.mode).filter(
		(date) =>
			cycle &&
			date <= q.today &&
			(!cycle.startDate || date >= cycle.startDate) &&
			(!cycle.endDate || date <= cycle.endDate) &&
			!excluded.has(date),
	);
	const dates = new Set(days);
	const groupIds = new Set(groups.map((g) => g.id));
	const students = new Set(s.students.map((student) => student.id));
	const buckets = new Map<string, State["events"]>();
	const byGroup = new Map(
		groups.map((g) => [g.id, new Map<string, State["events"]>()]),
	);
	const byDay = new Map(
		days.map((date) => [date, new Map<string, State["events"]>()]),
	);
	let latestDate: string | null = null;
	for (const event of s.events) {
		if (
			event.cycle !== q.cycle ||
			!event.group ||
			!groupIds.has(event.group) ||
			!students.has(event.student) ||
			event.date > q.today ||
			!!(cycle?.startDate && event.date < cycle.startDate) ||
			!!(cycle?.endDate && event.date > cycle.endDate) ||
			excluded.has(event.date) ||
			!rangeDays(event.date, "Día").length
		)
			continue;
		if (latestDate === null || event.date > latestDate) latestDate = event.date;
		if (!dates.has(event.date)) continue;
		// A transferred pupil still contributes only one school-wide student-day.
		const key = JSON.stringify([event.student, event.date]);
		for (const map of [
			buckets,
			byGroup.get(event.group)!,
			byDay.get(event.date)!,
		]) {
			const events = map.get(key) || [];
			events.push(event);
			map.set(key, events);
		}
	}
	return {
		latestDate,
		total: summarize(buckets),
		groups: groups.map((g) => ({ ...g, ...summarize(byGroup.get(g.id)!) })),
		days: days.map((date) => ({ date, ...summarize(byDay.get(date)!) })),
	};
}
