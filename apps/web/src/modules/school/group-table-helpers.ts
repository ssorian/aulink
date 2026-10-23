import type { State } from "./workflows";
export function rangeDays(date: string, mode: string): string[] {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
	const d = new Date(`${date}T12:00:00Z`);
	if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== date)
		return [];
	let count = 1;
	if (mode === "Semana") {
		d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
		count = 7;
	}
	if (mode === "Mes") {
		d.setUTCDate(1);
		count = new Date(
			Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
		).getUTCDate();
	}
	return Array.from({ length: count }, (_, i) => {
		const day = new Date(d);
		day.setUTCDate(d.getUTCDate() + i);
		return day.toISOString().slice(0, 10);
	});
}
export function attendanceStatus(events: State["events"]) {
	if (!events.length) return "Sin registros";
	const entries = events.filter((e) => /^entrada(?:\s|$)/i.test(e.kind));
	const exits = events.filter((e) => /^salida(?:\s|$)/i.test(e.kind));
	const absent = events.some((e) =>
		/^(inasistencia|ausencia|falta)(?: explícita)?$/i.test(e.kind),
	);
	if (absent)
		return entries.length || exits.length
			? "Pendiente de revisión"
			: "Inasistencia explícita";
	if (entries.length && exits.length)
		return exits.every((exit) =>
			entries.some((entry) => entry.time < exit.time),
		) && entries.every((entry) => exits.some((exit) => entry.time < exit.time))
			? "Entrada y salida"
			: "Pendiente de revisión";
	if (entries.length) return "Entrada sin salida";
	return "Pendiente de revisión";
}
export function gradeAverage(
	assignments: State["assignments"],
	grades: State["grades"],
	student: string,
) {
	const records = assignments.flatMap((a) =>
		grades.filter((g) => g.assignment === a.id && g.student === student),
	);
	const compatible =
		assignments.length > 0 &&
		assignments.every(
			(a) =>
				a.subject === assignments[0].subject &&
				a.min === assignments[0].min &&
				a.max === assignments[0].max,
		);
	return {
		value:
			compatible && records.length
				? records.reduce((sum, g) => sum + g.value, 0) / records.length
				: null,
		partial: records.length < assignments.length,
		draft: records.some((g) => !g.published),
	};
}
