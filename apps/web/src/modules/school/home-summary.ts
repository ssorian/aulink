import type { State } from "./workflows";

export type HomeDestination =
	| "students"
	| "groups"
	| "communications"
	| "setup";

/** Configuración local de la demo; no representa asistencia ni salud remota. */
export function summarizeHome(s: State) {
	const scheduledAssignments = new Set(
		s.schedules.map((item) => item.assignment),
	);
	const groupsWithSubjects = new Set(s.assignments.map((item) => item.group));
	const groupsWithSchedule = new Set(
		s.assignments
			.filter((item) => scheduledAssignments.has(item.id))
			.map((item) => item.group),
	);
	return {
		students: s.students.length,
		groups: s.groups.length,
		drafts: s.notices.filter((item) => !item.published).length,
		groupsWithoutSubjects: s.groups.filter(
			(item) => !groupsWithSubjects.has(item.id),
		).length,
		groupsWithoutSchedule: s.groups.filter(
			(item) => !groupsWithSchedule.has(item.id),
		).length,
		activeDevices: s.devices.filter((item) => item.active).length,
		inactiveDevices: s.devices.filter((item) => !item.active).length,
	};
}
