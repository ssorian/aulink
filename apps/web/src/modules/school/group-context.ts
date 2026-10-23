import { field } from "./view-helpers";
import { type State, wasEnrolled } from "./workflows";
export function enrolledStudents(s: State, group: string) {
	return s.students.filter((x) => wasEnrolled(s, x.id, group));
}
export function groupScope(s: State, group: string): State {
	const g = s.groups.find((g) => g.id === group);
	const assignments = s.assignments.filter((a) => a.group === group);
	return {
		...s,
		students: enrolledStudents(s, group),
		groups: s.groups.filter((x) => x.id === group),
		assignments,
		events: s.events.filter((e) => e.group === group && e.cycle === g?.cycle),
		conduct: s.conduct.filter((c) => c.group === group && c.cycle === g?.cycle),
		grades: s.grades.filter((x) =>
			assignments.some((a) => a.id === x.assignment),
		),
		schedules: s.schedules.filter((x) =>
			assignments.some((a) => a.id === x.assignment),
		),
	};
}
export function registrationContext(s: State, group: string) {
	const g = s.groups.find((g) => g.id === group);
	if (!g) throw Error("Grupo inexistente.");
	return {
		fields: [
			field("name", "Nombre del alumno"),
			field("matricula", "Matrícula única"),
		],
		values: { group: g.id },
		preview: [
			`Grupo: ${g.name} · Ciclo: ${s.cycles.find((c) => c.id === g.cycle)?.name}`,
		],
	};
}
