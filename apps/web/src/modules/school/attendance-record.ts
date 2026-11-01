/**
 * Attendance record of one student for the elapsed part of a cycle.
 * General percent comes from campus entries; subject percents come from each
 * teacher's roll call. They are separate figures and never merged.
 */
export type ClassMark = "Presente" | "Retardo" | "Falta" | "Sin pase de lista";

export type AttendanceDay = {
	date: string;
	/** A campus entry was recorded by the terminal that day. */
	entered: boolean;
	classes: { subject: string; mark: ClassMark }[];
};

export type AttendanceRules = {
	/** Minimum percent per subject to pass without extraordinario. */
	minimumPercent: number;
	/** How many lates add up to one absence. */
	latesPerAbsence: number;
};

export type MissedDay = {
	date: string;
	/** No campus entry: the student missed the whole day. */
	wholeDay: boolean;
	subjects: string[];
};

export type SubjectAttendance = {
	subject: string;
	total: number;
	attended: number;
	absences: number;
	lates: number;
	percent: number;
	atRisk: boolean;
};

/** Floor, so a failing value is never displayed as the minimum. */
const percentOf = (part: number, whole: number) =>
	whole ? Math.floor((part * 100) / whole) : null;

export function summarizeAttendance(
	days: readonly AttendanceDay[],
	justified: ReadonlyMap<string, string>,
	rules: AttendanceRules,
) {
	const bySubject = new Map<
		string,
		{ total: number; absences: number; lates: number }
	>();
	const pending: MissedDay[] = [];
	const done: (MissedDay & { reason: string })[] = [];

	for (const day of days) {
		const reason = justified.get(day.date);
		const missed: string[] = [];
		for (const { subject, mark } of day.classes) {
			const row = bySubject.get(subject) ?? { total: 0, absences: 0, lates: 0 };
			row.total++;
			if (mark === "Falta") {
				// A double period is still one subject missed that day.
				if (!missed.includes(subject)) missed.push(subject);
				if (reason === undefined) row.absences++;
			}
			if (mark === "Retardo") row.lates++;
			bySubject.set(subject, row);
		}
		if (day.entered && !missed.length) continue;
		const entry = { date: day.date, wholeDay: !day.entered, subjects: missed };
		if (reason === undefined) pending.push(entry);
		else done.push({ ...entry, reason });
	}

	const subjects: SubjectAttendance[] = [...bySubject].map(
		([subject, { total, absences, lates }]) => {
			const lost = absences + Math.floor(lates / rules.latesPerAbsence);
			const attended = total - lost;
			const percent = percentOf(attended, total) ?? 0;
			return {
				subject,
				total,
				attended,
				absences,
				lates,
				percent,
				atRisk: percent < rules.minimumPercent,
			};
		},
	);

	const attendedDays = days.filter(
		(d) => d.entered || justified.has(d.date),
	).length;
	const byRecent = (a: MissedDay, b: MissedDay) => b.date.localeCompare(a.date);

	return {
		general: {
			attended: attendedDays,
			total: days.length,
			percent: percentOf(attendedDays, days.length),
		},
		subjects,
		pending: pending.sort(byRecent),
		justified: done.sort(byRecent),
	};
}
