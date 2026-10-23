import { type State, wasEnrolled } from "./workflows";

export function filterDirectory(
	s: State,
	query: string,
	group: string,
	cycle: string,
) {
	const normalize = (text: string) =>
		text
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase();
	const search = normalize(query.trim());
	return s.students.filter(
		(student) =>
			normalize(`${student.name} ${student.matricula}`).includes(search) &&
			(!group || wasEnrolled(s, student.id, group)) &&
			(!cycle || student.enrollments.some((e) => e.cycle === cycle)) &&
			(!group ||
				!cycle ||
				s.groups.some((g) => g.id === group && g.cycle === cycle)),
	);
}

// Counts evidence only: missing events never imply an absence.
export function summarizeAttendance(
	events: ReadonlyArray<{ id: string }>,
	adjustments: ReadonlyArray<{ event: string }>,
) {
	const adjustedIds = new Set(adjustments.map((a) => a.event));
	const adjusted = events.filter((e) => adjustedIds.has(e.id)).length;
	return {
		events: events.length,
		adjusted,
		unchanged: events.length - adjusted,
	};
}
