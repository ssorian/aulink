import { recipients, type State } from "../shared/workflows";

export function validateCommunicationTarget(
	s: State,
	audience: string,
	target: string,
) {
	if (audience === "school") return undefined;
	if (audience === "group") {
		return s.groups.some((group) => group.id === target)
			? undefined
			: "Selecciona un grupo existente para esta audiencia.";
	}
	if (audience === "student") {
		return s.students.some((student) => student.id === target)
			? undefined
			: "Selecciona un alumno existente para esta audiencia.";
	}
	return "Selecciona una audiencia disponible.";
}

export function communicationSummary(
	s: State,
	notice: State["notices"][number],
) {
	const cycleName = (id: string) =>
		s.cycles.find((c) => c.id === id)?.name || "Ciclo no disponible";
	const group = s.groups.find((g) => g.id === notice.target);
	const student = s.students.find((x) => x.id === notice.target);
	let audience: string;
	if (notice.audience === "school") {
		audience = `Escuela: ${s.school.name} · Ciclos: ${s.cycles.map((c) => c.name).join(", ") || "Sin ciclos"}`;
	} else if (notice.audience === "group") {
		audience = `Grupo: ${group?.name || "No disponible"} · ${group ? cycleName(group.cycle) : "Ciclo no disponible"}`;
	} else {
		audience = `Alumno: ${student?.name || "No disponible"} · Ciclos: ${student?.enrollments.map((e) => cycleName(e.cycle)).join(", ") || "Sin inscripción"}`;
	}
	const names = notice.published
		? [...notice.recipients]
		: recipients(s, notice.audience, notice.target);
	return {
		audience,
		recipients: names,
		canPublish: !notice.published && names.length > 0,
		preview: { title: notice.title, text: notice.text },
	};
}
