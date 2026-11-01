/**
 * Illustrative attendance record for the profile preview. The state has no
 * per-class roll call or attendance rules yet, so every student shows this
 * fixed sample and the UI labels it "Datos de muestra". Replace with real
 * records and the school's configured rules, never extend.
 */
import type {
	AttendanceDay,
	AttendanceRules,
	ClassMark,
} from "./attendance-record";

export const DEMO_RULES: AttendanceRules = {
	minimumPercent: 80,
	latesPerAbsence: 3,
};

export const DEMO_CUTOFF = "2026-10-23";

/** Initial justifications, date → reason. */
export const DEMO_JUSTIFIED: ReadonlyMap<string, string> = new Map([
	["2026-09-07", "Enfermedad · justificante médico"],
]);

const timetable: Record<number, string[]> = {
	1: ["Matemáticas", "Lengua", "Ciencias", "Historia", "Inglés", "Artes"],
	2: [
		"Matemáticas",
		"Lengua",
		"Ciencias",
		"Inglés",
		"Educación física",
		"Historia",
	],
	3: [
		"Matemáticas",
		"Lengua",
		"Ciencias",
		"Historia",
		"Educación física",
		"Matemáticas",
	],
	4: ["Matemáticas", "Lengua", "Ciencias", "Inglés", "Artes", "Lengua"],
	5: [
		"Matemáticas",
		"Lengua",
		"Ciencias",
		"Historia",
		"Inglés",
		"Educación física",
	],
};

const holidays = new Set(["2026-09-16"]);
const absentDays = new Set(["2026-09-07", "2026-10-08"]);
const exceptions: Record<string, Record<string, ClassMark>> = {
	"2026-09-15": { Lengua: "Retardo" },
	"2026-09-24": { Artes: "Falta" },
	"2026-09-29": { Lengua: "Retardo" },
	"2026-10-01": { Artes: "Falta", Inglés: "Falta" },
	"2026-10-06": { Lengua: "Retardo" },
	"2026-10-12": { Artes: "Falta" },
	"2026-10-19": { Ciencias: "Falta" },
	"2026-10-20": {
		Inglés: "Sin pase de lista",
		"Educación física": "Sin pase de lista",
	},
	"2026-10-22": { Artes: "Falta", Lengua: "Retardo" },
	"2026-10-23": { Historia: "Sin pase de lista" },
};

function schoolDays(from: string, to: string) {
	const days: string[] = [];
	for (
		let d = new Date(`${from}T12:00:00Z`);
		d <= new Date(`${to}T12:00:00Z`);
		d.setUTCDate(d.getUTCDate() + 1)
	) {
		const date = d.toISOString().slice(0, 10);
		if (timetable[d.getUTCDay()] && !holidays.has(date)) days.push(date);
	}
	return days;
}

export const DEMO_ATTENDANCE: readonly AttendanceDay[] = schoolDays(
	"2026-08-24",
	DEMO_CUTOFF,
).map((date) => {
	const entered = !absentDays.has(date);
	const subjects = timetable[new Date(`${date}T12:00:00Z`).getUTCDay()];
	return {
		date,
		entered,
		classes: subjects.map((subject) => ({
			subject,
			mark: entered ? (exceptions[date]?.[subject] ?? "Presente") : "Falta",
		})),
	};
});
