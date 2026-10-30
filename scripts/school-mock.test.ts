import { expect, test } from "bun:test";
import {
	buildMockData,
	mergeMockData,
} from "../apps/web/src/modules/school/mock-data";
import {
	initialState,
	recipients,
	restore,
	wasEnrolled,
} from "../apps/web/src/modules/school/workflows";

test("seed records use natural school names and complete personal names", () => {
	for (const s of [initialState(), buildMockData()]) {
		expect(JSON.stringify(s)).not.toMatch(/ejemplo|demo|muestra|sintétic|simulación/i);
		expect(s.school.name).toBe("Instituto Aurora");
		for (const student of s.students) expect(student.name.split(" ").length).toBeGreaterThanOrEqual(3);
	}
});

test("only canonical and legacy verified guardians receive notices", () => {
	const s = initialState();
	for (const status of ["Verificado", "Verificado DEMO", "Pendiente", "Restringido", "Revocado", "Desconocido"]) {
		s.links[0].status = status;
		expect(recipients(s, "school", "").length).toBe(status === "Verificado" || status === "Verificado DEMO" ? 1 : 0);
	}
});

test("legacy seed migration preserves edited rows, custom data and histories", async () => {
	const { migrateLegacySeed } = await import("../apps/web/src/modules/school/seed-migration");
	const old = buildMockData(true);
	old.school.name = "Colegio Aurora · Demo";
	old.students[0].name = "Lucía Prueba";
	old.students.push({ id: "custom", name: "Importado Demo", matricula: "IMP-01", enrollments: [] });
	old.links[0].history.push({ id: "custom-audit", author: "Secretaría", value: "Nota", reason: "Conservar" });
	old.notices[0].recipients.push("Destinatario histórico");
	const before = structuredClone(old);
	const result = migrateLegacySeed(old);
	expect(result.changed).toBe(true);
	expect(old).toEqual(before);
	expect(result.state.school).toEqual(before.school);
	expect(result.state.students[0]).toEqual(before.students[0]);
	expect(result.state.students.at(-1)).toEqual(before.students.at(-1));
	expect(result.state.links[0]).toEqual(before.links[0]);
	expect(result.state.notices[0]).toEqual(before.notices[0]);
	expect(result.state.students[1]).toEqual(buildMockData().students[1]);
	expect(migrateLegacySeed(result.state)).toEqual({ state: result.state, changed: false });
	expect(mergeMockData(result.state).added).toBe(0);
	for (const legacy of [initialState(true), buildMockData(true)]) {
		const migrated = migrateLegacySeed(legacy);
		expect(migrated.state).toEqual(legacy.students.length === 2 ? initialState() : buildMockData());
		expect(migrateLegacySeed(migrated.state).changed).toBe(false);
	}
});

test("migration does not introduce registration, cycle or group identity collisions", async () => {
	const { migrateLegacySeed } = await import("../apps/web/src/modules/school/seed-migration");
	const old = buildMockData(true);
	const next = buildMockData();
	old.students.push({ ...next.students[0], id: "custom-student" });
	old.cycles.push({ ...next.cycles[0], id: "custom-cycle" });
	old.groups.push({ ...next.groups[0], id: "custom-group" });
	const migrated = migrateLegacySeed(old).state;
	expect(migrated.students[0]).toEqual(old.students[0]);
	expect(migrated.cycles[0]).toEqual(old.cycles[0]);
	expect(migrated.groups[0]).toEqual(old.groups[0]);
	expect(migrated.students.at(-1)).toEqual(old.students.at(-1));
	expect(migrated.cycles.at(-1)).toEqual(old.cycles.at(-1));
	expect(migrated.groups.at(-1)).toEqual(old.groups.at(-1));
	expect(migrateLegacySeed(migrated).changed).toBe(false);
	expect(mergeMockData(migrated).added).toBe(0);
});

test("seed teachers have no simultaneous lessons within a cycle", () => {
	const s = buildMockData();
	for (const slot of s.schedules) {
		const a = s.assignments.find((x) => x.id === slot.assignment)!;
		const cycle = s.groups.find((x) => x.id === a.group)!.cycle;
		expect(s.schedules.some((other) => {
			const b = s.assignments.find((x) => x.id === other.assignment)!;
			return other.id !== slot.id && a.teacher === b.teacher && s.groups.find((x) => x.id === b.group)!.cycle === cycle && other.day === slot.day && other.start < slot.end && other.end > slot.start;
		})).toBe(false);
	}
});

test("rich sample validates schema, unique IDs and domain references", () => {
	const s = buildMockData();
	expect(restore(JSON.stringify(s))).toEqual(s);
	expect(s.students).toHaveLength(48);
	expect(s.groups).toHaveLength(8);
	const ids = Object.values(s)
		.filter(Array.isArray)
		.flat()
		.map((x) => x.id);
	expect(new Set(ids).size).toBe(ids.length);
	expect(new Set(s.students.map((x) => x.matricula)).size).toBe(48);
	for (const x of s.students)
		for (const e of x.enrollments)
			expect(
				s.groups.some((g) => g.id === e.group && g.cycle === e.cycle),
			).toBe(true);
	for (const e of [...s.events, ...s.conduct]) {
		expect(wasEnrolled(s, e.student, e.group || "")).toBe(true);
		expect(s.groups.find((g) => g.id === e.group)?.cycle).toBe(e.cycle);
	}
	for (const g of s.grades) {
		const a = s.assignments.find((a) => a.id === g.assignment);
		expect(a).toBeDefined();
		expect(wasEnrolled(s, g.student, a?.group || "")).toBe(true);
		expect(g.value).toBeGreaterThanOrEqual(a?.min || 0);
		expect(g.value).toBeLessThanOrEqual(a?.max || 0);
	}
	for (const link of s.links)
		expect(s.students.some((x) => x.id === link.student)).toBe(true);
	for (const c of s.credentials)
		expect(s.students.some((x) => x.id === c.student)).toBe(true);
	for (const a of s.adjustments)
		expect(s.events.some((e) => e.id === a.event)).toBe(true);
});
test("current groups cover lower and upper secondary plans whose averages differ by subject", () => {
	const s = buildMockData();
	const current = s.groups.filter((g) => g.cycle === s.cycles[0].id);
	expect(current.map((g) => g.name)).toEqual(["1° A", "1° B", "2° A", "2° B", "3° A", "1° Semestre A", "3° Semestre A"]);
	const means = new Map<string, number[]>();
	for (const group of current) {
		const first = s.assignments.filter((a) => a.group === group.id && a.period === "Primer trimestre");
		expect(first.length).toBeGreaterThanOrEqual(7);
		expect(new Set(first.map((a) => a.teacher)).size).toBe(first.length);
		for (const a of first) {
			expect(s.schedules.some((slot) => slot.assignment === a.id)).toBe(true);
			expect(s.staff.some((x) => x.name === a.teacher && x.role === "Docente")).toBe(true);
			const values = s.grades.filter((x) => x.assignment === a.id).map((x) => x.value);
			means.set(a.subject, [...(means.get(a.subject) || []), ...values]);
		}
	}
	const average = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
	const ranked = [...means.values()].map(average).sort((a, b) => a - b);
	expect(ranked.at(-1)! - ranked[0]).toBeGreaterThanOrEqual(2);
	expect(average(means.get("Educación Física")!)).toBeGreaterThan(average(means.get("Matemáticas")!) + 1);
	expect(s.assignments.some((a) => a.period === "Segundo trimestre" && !s.grades.some((g) => g.assignment === a.id))).toBe(true);
	expect(s.grades.some((g) => !g.published && s.assignments.find((a) => a.id === g.assignment)?.period === "Segundo trimestre")).toBe(true);
});
test("weekly schedule has valid assignments and no group overlap; published audience snapshots agree", () => {
	const s = buildMockData();
	for (const slot of s.schedules) {
		expect(slot.start < slot.end).toBe(true);
		const a = s.assignments.find((a) => a.id === slot.assignment);
		expect(a).toBeDefined();
		expect(
			s.schedules.some(
				(other) =>
					other.id !== slot.id &&
					other.day === slot.day &&
					s.assignments.find((x) => x.id === other.assignment)?.group ===
						a?.group &&
					other.start < slot.end &&
					other.end > slot.start,
			),
		).toBe(false);
	}
	for (const n of s.notices.filter((n) => n.published))
		expect(n.recipients).toEqual(recipients(s, n.audience, n.target));
});
test("merge is idempotent and preserves edited values and histories", () => {
	const initial = initialState();
	const s = mergeMockData(initial).state;
	expect(s.students).toHaveLength(50);
	expect(s.cycles).toHaveLength(3);
	expect(s.groups).toHaveLength(10);
	expect(s.cycles.slice(0, 1)).toEqual(initial.cycles);
	expect(s.groups.slice(0, 2)).toEqual(initial.groups);
	expect(s.students[2].enrollments.at(-1)?.cycle).toBe("sample-v1-cycle-1");
	s.students[2].name = "Nombre editado";
	s.links[1].status = "Revocado";
	s.grades[0].history.push({
		id: "custom-history",
		author: "Demo",
		reason: "Prueba",
		value: "Cambio conservado",
	});
	const before = structuredClone(s);
	const result = mergeMockData(s);
	expect(result.state).toEqual(before);
	expect(result.added).toBe(0);
	expect(initial).toEqual(initialState());
});
test("same matricula or logical group conflict skips dependent records without attaching to existing student", () => {
	const seed = buildMockData();
	const s = initialState();
	s.students[0].matricula = seed.students[0].matricula;
	const result = mergeMockData(s);
	expect(
		result.state.students.filter(
			(x) => x.matricula === s.students[0].matricula,
		),
	).toHaveLength(1);
	expect(result.state.students[0]).toEqual(s.students[0]);
	expect(
		result.state.links.some((x) => x.student === seed.students[0].id),
	).toBe(false);
	expect(result.conflicts.length).toBeGreaterThan(0);
	const groupConflict = initialState();
	groupConflict.cycles.push(seed.cycles[0]);
	groupConflict.groups.push({ ...seed.groups[0], id: "custom-group" });
	const merged = mergeMockData(groupConflict);
	expect(merged.state.groups.some((g) => g.id === seed.groups[0].id)).toBe(
		false,
	);
	expect(
		merged.state.students.some((x) =>
			x.enrollments.some((e) => e.group === seed.groups[0].id),
		),
	).toBe(false);
});

test("partial seed with user-owned domain records does not duplicate grades, links or override active group", () => {
	const seed = buildMockData();
	const base = structuredClone(seed);
	base.transfers = [
		{
			...seed.transfers[0],
			id: "user-transfer",
			to: seed.groups[2].id,
			reason: "Cambio del usuario",
		},
	];
	base.grades = [{ ...seed.grades[0], id: "user-grade", value: 5 }];
	base.links = [{ ...seed.links[0], id: "user-link", status: "Revocado" }];
	base.schedules = [{ ...seed.schedules[0], id: "user-slot" }];
	base.credentials = [
		{ ...seed.credentials[0], id: "user-credential", revision: 4 },
	];
	const merged = mergeMockData(base).state;
	expect(
		merged.transfers.filter((t) => t.student === seed.students[0].id),
	).toEqual(base.transfers);
	expect(
		merged.grades.filter(
			(g) =>
				g.student === base.grades[0].student &&
				g.assignment === base.grades[0].assignment,
		),
	).toEqual(base.grades);
	expect(
		merged.links.filter(
			(l) =>
				l.student === base.links[0].student && l.name === base.links[0].name,
		),
	).toEqual(base.links);
	expect(
		merged.schedules.filter(
			(x) => x.assignment === base.schedules[0].assignment,
		),
	).toEqual(base.schedules);
	expect(
		merged.credentials.filter(
			(c) => c.student === base.credentials[0].student && c.active,
		),
	).toEqual(base.credentials);
});
