import { expect, test } from "bun:test";
import {
	enrolledStudents,
	groupScope,
	registrationContext,
} from "../apps/web/src/modules/school/group-context";
import {
	apply,
	initialState,
	restore,
} from "../apps/web/src/modules/school/workflows";

test("group context selects enrollment references, not latest membership", () => {
	let s = initialState();
	s = apply(s, { kind: "cycle", data: { name: "Next" } });
	const cycle = s.cycles[1].id;
	s = apply(s, { kind: "group", data: { name: "Next A", cycle } });
	const group = s.groups[2].id;
	s = apply(s, { kind: "enroll", data: { student: "s1", group } });
	expect(s.students).toHaveLength(2);
	expect(enrolledStudents(s, "g1").map((x) => x.id)).toEqual(["s1"]);
	expect(enrolledStudents(s, group).map((x) => x.id)).toEqual(["s1"]);
	expect(groupScope(s, "g1").events).toHaveLength(1);
	expect(groupScope(s, group).events).toHaveLength(0);
	expect(registrationContext(s, group).values.group).toBe(group);
	expect(
		registrationContext(s, group).fields.some((f) => f.key === "group"),
	).toBe(false);
});
test("conduct stores group and cycle, rejects student from another group", () => {
	const s = initialState();
	const data = {
		student: "s1",
		group: "g2",
		kind: "Incidente",
		text: "Demo",
		followup: "Demo",
		shared: "Interno",
	};
	expect(() => apply(s, { kind: "conduct", data })).toThrow();
	const next = apply(s, { kind: "conduct", data: { ...data, group: "g1" } });
	expect(next.conduct[0].group).toBe("g1");
	expect(next.conduct[0].cycle).toBe("c1");
});
test("weekly schedules reject invalid intervals and group overlaps, allow adjacency", () => {
	let s = apply(initialState(), {
		kind: "assignment",
		data: {
			group: "g1",
			subject: "Historia",
			teacher: "Docente",
			period: "P1",
			min: "0",
			max: "10",
		},
	});
	const assignment = s.assignments[0].id;
	expect(() =>
		apply(s, {
			kind: "schedule",
			data: { assignment, day: "Lunes", start: "10:00", end: "09:00" },
		}),
	).toThrow();
	s = apply(s, {
		kind: "schedule",
		data: { assignment, day: "Lunes", start: "09:00", end: "10:00" },
	});
	expect(() =>
		apply(s, {
			kind: "schedule",
			data: { assignment, day: "Lunes", start: "09:30", end: "10:30" },
		}),
	).toThrow();
	s = apply(s, {
		kind: "schedule",
		data: { assignment, day: "Lunes", start: "10:00", end: "11:00" },
	});
	expect(s.schedules).toHaveLength(2);
	expect(() =>
		apply(s, {
			kind: "schedule",
			data: { assignment, day: "Lunes", start: "25:00", end: "26:00" },
		}),
	).toThrow();
});
test("legacy storage preserves data and marks unsnapshotted history unknown", () => {
	const s = initialState();
	const legacy = JSON.parse(JSON.stringify(s));
	delete legacy.schedules;
	delete legacy.events[0].group;
	delete legacy.events[0].cycle;
	const restored = restore(JSON.stringify(legacy));
	expect(restored?.students).toHaveLength(2);
	expect(restored?.schedules).toEqual([]);
	expect(restored?.events[0].group).toBeUndefined();
	expect(groupScope(restored || initialState(), "g1").events).toHaveLength(0);
});

test("same-cycle transfer appends trace without duplicate enrollment or history move", () => {
	let s = initialState();
	const before = JSON.stringify(s.students[0].enrollments);
	s = apply(s, {
		kind: "transfer",
		data: { student: "s1", group: "g2", reason: "Cambio demo" },
	});
	expect(s.students).toHaveLength(2);
	expect(JSON.stringify(s.students[0].enrollments)).toBe(before);
	expect(s.transfers[0].from).toBe("g1");
	expect(s.transfers[0].to).toBe("g2");
	expect(groupScope(s, "g1").events).toHaveLength(1);
	expect(groupScope(s, "g2").events).toHaveLength(0);
	expect(() =>
		apply(s, {
			kind: "transfer",
			data: { student: "s1", group: "g2", reason: "Otra vez" },
		}),
	).toThrow();
});

test("grade and conduct group associations survive new cycle enrollment", () => {
	let s = apply(initialState(), {
		kind: "assignment",
		data: {
			group: "g1",
			subject: "Historia",
			teacher: "Demo",
			period: "P1",
			min: "0",
			max: "10",
		},
	});
	s = apply(s, {
		kind: "grade",
		data: { assignment: s.assignments[0].id, student: "s1", value: "9" },
	});
	s = apply(s, {
		kind: "conduct",
		data: {
			student: "s1",
			group: "g1",
			kind: "Reconocimiento",
			text: "Demo",
			followup: "Demo",
			shared: "Interno",
		},
	});
	s = apply(s, { kind: "cycle", data: { name: "2027–2028" } });
	s = apply(s, {
		kind: "group",
		data: { name: "Nuevo", cycle: s.cycles[1].id },
	});
	const group = s.groups[2].id;
	s = apply(s, { kind: "enroll", data: { student: "s1", group } });
	expect(groupScope(s, "g1").grades).toHaveLength(1);
	expect(groupScope(s, "g1").conduct).toHaveLength(1);
	expect(groupScope(s, group).grades).toHaveLength(0);
	expect(groupScope(s, group).conduct).toHaveLength(0);
	expect(groupScope(s, "g2").students.map((x) => x.id)).toEqual(["s2"]);
});
test("overlap applies across assignments in same group, not across groups", () => {
	let s = initialState();
	for (const group of ["g1", "g1", "g2"])
		s = apply(s, {
			kind: "assignment",
			data: {
				group,
				subject: "Materia",
				teacher: "Demo",
				period: "P1",
				min: "0",
				max: "10",
			},
		});
	const slot = { day: "Martes", start: "09:00", end: "10:00" };
	s = apply(s, {
		kind: "schedule",
		data: { ...slot, assignment: s.assignments[0].id },
	});
	expect(() =>
		apply(s, {
			kind: "schedule",
			data: { ...slot, assignment: s.assignments[1].id },
		}),
	).toThrow();
	expect(
		apply(s, {
			kind: "schedule",
			data: { ...slot, assignment: s.assignments[2].id },
		}).schedules,
	).toHaveLength(2);
});
