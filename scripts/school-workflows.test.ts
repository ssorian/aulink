import { expect, test } from "bun:test";
import {
	apply,
	initialState,
	previewCSV,
	recipients,
	restore,
	type State,
} from "../apps/web/src/modules/school/shared/workflows";

const run = (s: State, kind: string, data: Record<string, string>) =>
	apply(s, { kind, data });
test("registration uniqueness, import validation and cancellation", () => {
	const s = initialState();
	expect(() =>
		run(s, "student", { name: "Otro", matricula: "AUR-26001", group: "g1" }),
	).toThrow();
	expect(s.students).toHaveLength(2);
	const rows = previewCSV(
		s,
		"Nombre,Matrícula,Grupo\nAna,D-3,g1\nAna,D-3,g1\nMal,D-4,no",
	);
	expect(rows.filter((r) => !r.error)).toHaveLength(1);
});
test("re-enrollment preserves history", () => {
	let s = initialState();
	s = run(s, "cycle", { name: "2027" });
	s = run(s, "group", { name: "2A", cycle: s.cycles.at(-1)?.id || "" });
	s = run(s, "enroll", { student: "s1", group: s.groups.at(-1)?.id || "" });
	expect(s.students[0].enrollments).toHaveLength(2);
});
test("guardian revoke changes audience and keeps history", () => {
	let s = initialState();
	expect(recipients(s, "school", "")).toHaveLength(1);
	s = run(s, "guardian-status", {
		id: "l1",
		status: "Revocado",
		reason: "Prueba",
	});
	expect(recipients(s, "school", "")).toHaveLength(0);
	expect(s.links[0].history).toHaveLength(1);
});
test("credential reissue revokes prior revision", () => {
	let s = initialState();
	s = run(s, "credential", { student: "s1", reason: "Primera" });
	s = run(s, "credential", { student: "s1", reason: "Reemplazo" });
	expect(s.credentials.map((c) => c.active)).toEqual([false, true]);
});
test("attendance adjustments never change original event", () => {
	let s = initialState();
	const original = JSON.stringify(s.events);
	s = run(s, "adjust", {
		event: "e1",
		reason: "Justificación",
		value: "Entrada justificada",
	});
	expect(JSON.stringify(s.events)).toBe(original);
	expect(s.adjustments).toHaveLength(1);
	expect(() =>
		run(s, "adjust", { event: "e1", reason: "", value: "Cambio" }),
	).toThrow();
});
test("publication and grade bounds guarded", () => {
	let s = initialState();
	expect(() => run(s, "notice-publish", { id: "missing" })).toThrow();
	s = run(s, "assignment", {
		subject: "Historia",
		teacher: "Docente demo",
		period: "P1",
		group: "g1",
		min: "0",
		max: "10",
	});
	expect(() =>
		run(s, "grade", {
			assignment: s.assignments[0].id,
			student: "s1",
			value: "11",
		}),
	).toThrow();
	expect(() =>
		run(s, "grade", {
			assignment: s.assignments[0].id,
			student: "s2",
			value: "8",
		}),
	).toThrow();
});
test("invalid persisted data recovers safely", () => {
	expect(restore("{broken")).toBeNull();
	expect(restore('{"version":1,"students":[]}')).toBeNull();
	expect(restore(JSON.stringify(initialState()))?.students).toHaveLength(2);
});

test("audiences deduplicate shared guardians and exclude restricted links", () => {
	let s = initialState();
	s = run(s, "guardian", {
		student: "s2",
		name: "Mariana Ruiz Salcedo",
		reason: "Verificación sintética",
	});
	expect(recipients(s, "school", "")).toEqual(["Mariana Ruiz Salcedo"]);
	expect(recipients(s, "group", "g2")).toEqual(["Mariana Ruiz Salcedo"]);
	expect(recipients(s, "student", "s1")).toEqual(["Mariana Ruiz Salcedo"]);
	s = run(s, "guardian-status", {
		id: "l1",
		status: "Restringido",
		reason: "Prueba",
	});
	expect(recipients(s, "student", "s1")).toEqual([]);
	expect(recipients(s, "school", "")).toEqual(["Mariana Ruiz Salcedo"]);
});
test("draft editing, publication snapshot and no recipients guard", () => {
	let s = initialState();
	s = run(s, "notice", {
		title: "Borrador",
		text: "Contenido",
		audience: "school",
	});
	const id = s.notices[0].id;
	expect(s.notices[0].published).toBe(false);
	s = run(s, "notice", {
		id,
		title: "Revisado",
		text: "Nuevo",
		audience: "school",
	});
	s = run(s, "notice-publish", { id });
	expect(s.notices[0].recipients).toEqual(["Mariana Ruiz Salcedo"]);
	expect(s.notices[0].published).toBe(true);
	expect(() =>
		run(s, "notice", { id, title: "Cambio", text: "No", audience: "school" }),
	).toThrow();
	s = run(s, "notice", {
		title: "Sin audiencia",
		text: "Contenido",
		audience: "student",
		target: "s2",
	});
	expect(() => run(s, "notice-publish", { id: s.notices[1].id })).toThrow();
});
test("grade review then publication and correction retain original history", () => {
	let s = initialState();
	s = run(s, "assignment", {
		subject: "Historia",
		teacher: "Docente demo",
		period: "P1",
		group: "g1",
		min: "0",
		max: "10",
	});
	const assignment = s.assignments[0].id;
	s = run(s, "grade", { assignment, student: "s1", value: "8.5" });
	expect(s.grades[0].published).toBe(false);
	s = run(s, "grade-publish", { id: s.grades[0].id });
	expect(() =>
		run(s, "grade", { assignment, student: "s1", value: "9" }),
	).toThrow();
	s = run(s, "grade", {
		assignment,
		student: "s1",
		value: "9",
		reason: "Revisión demo",
	});
	expect(s.grades[0].history[0].value).toBe("8.5 → 9");
	expect(s.grades[0].history[0].author).toBe("Patricia Salgado Méndez");
});
test("failed commands leave entire prior state unchanged", () => {
	const s = initialState(),
		before = JSON.stringify(s);
	expect(() => run(s, "enroll", { student: "s1", group: "g1" })).toThrow();
	expect(() =>
		run(s, "guardian-status", { id: "l1", status: "Revocado", reason: "" }),
	).toThrow();
	expect(JSON.stringify(s)).toBe(before);
});

test("conduct followup appends without exposing internal notes", () => {
	let s = initialState();
	s = run(s, "conduct", {
		student: "s1",
		kind: "Reconocimiento",
		text: "Participación",
		internal: "Nota privada demo",
		followup: "Acuerdo inicial",
		shared: "Compartido",
	});
	const id = s.conduct[0].id;
	s = run(s, "conduct-followup", {
		id,
		followup: "Acuerdo revisado",
		reason: "Reunión demo",
	});
	expect(s.conduct[0].followup).toContain("Acuerdo inicial");
	expect(s.conduct[0].followup).toContain("Acuerdo revisado");
	expect(s.conduct[0].text).not.toContain("Nota privada");
});
