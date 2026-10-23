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

test("rich sample validates schema, unique IDs and domain references", () => {
	const s = buildMockData();
	expect(restore(JSON.stringify(s))).toEqual(s);
	expect(s.students).toHaveLength(36);
	expect(s.groups).toHaveLength(6);
	const ids = Object.values(s)
		.filter(Array.isArray)
		.flat()
		.map((x) => x.id);
	expect(new Set(ids).size).toBe(ids.length);
	expect(new Set(s.students.map((x) => x.matricula)).size).toBe(36);
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
	expect(s.students).toHaveLength(38);
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
