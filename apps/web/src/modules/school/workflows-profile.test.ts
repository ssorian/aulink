// @ts-expect-error Bun runs these tests; browser compilation excludes its types.
import { expect, test } from "bun:test";
import { buildMockData } from "./mock-data";
import {
	activeGroup,
	apply,
	initialState,
	recipients,
	restore,
	wasEnrolled,
} from "./workflows";

const base = () => initialState();

test("guardian-edit sets contact data and stores empty optionals as undefined", () => {
	const next = apply(base(), {
		kind: "guardian-edit",
		data: {
			id: "l1",
			name: "  Mariana R. ",
			relation: "Madre",
			phone: "5512345678",
			email: "",
		},
	});
	expect(next.links[0]).toMatchObject({
		name: "Mariana R.",
		relation: "Madre",
		phone: "5512345678",
		email: undefined,
	});
});

test("guardian-edit rejects unknown links and empty names, leaving state untouched", () => {
	const s = base();
	const before = structuredClone(s);
	expect(() =>
		apply(s, { kind: "guardian-edit", data: { id: "nope", name: "X" } }),
	).toThrow("Vínculo no encontrado.");
	expect(() =>
		apply(s, { kind: "guardian-edit", data: { id: "l1", name: "  " } }),
	).toThrow();
	expect(s).toEqual(before);
});

test("withdraw removes the student from the active group and guardian audiences", () => {
	const s = base();
	expect(activeGroup(s, "s1", "c1")).toBe("g1");
	expect(recipients(s, "group", "g1")).toHaveLength(1);
	const next = apply(s, {
		kind: "withdraw",
		data: { student: "s1", reason: "Cambio de ciudad" },
	});
	expect(next.withdrawals).toHaveLength(1);
	expect(next.withdrawals[0]).toMatchObject({ student: "s1", cycle: "c1" });
	expect(activeGroup(next, "s1", "c1")).toBeUndefined();
	expect(recipients(next, "group", "g1")).toEqual([]);
	// Other students and past enrollment history are unaffected.
	expect(activeGroup(next, "s2", "c1")).toBe("g2");
	expect(wasEnrolled(next, "s1", "g1")).toBe(true);
	expect(s.withdrawals).toEqual([]);
});

test("withdraw rejects bad input and a second withdrawal in the same cycle", () => {
	const s = base();
	const before = structuredClone(s);
	expect(() =>
		apply(s, { kind: "withdraw", data: { student: "zz", reason: "x" } }),
	).toThrow();
	expect(() =>
		apply(s, { kind: "withdraw", data: { student: "s1", reason: " " } }),
	).toThrow();
	expect(s).toEqual(before);
	const once = apply(s, {
		kind: "withdraw",
		data: { student: "s1", reason: "Baja" },
	});
	expect(() =>
		apply(once, { kind: "withdraw", data: { student: "s1", reason: "Otra" } }),
	).toThrow("El alumno ya está dado de baja en este ciclo.");
});

test("older saved data without the new fields still restores", () => {
	const old = JSON.parse(JSON.stringify(initialState(true)));
	delete old.withdrawals;
	const restored = restore(JSON.stringify(old));
	expect(restored?.withdrawals).toEqual([]);
	expect(restored?.links[0].phone).toBeUndefined();
});

test("sample guardians carry relation, and some contact data stays empty", () => {
	const s = buildMockData();
	const mariana = s.links.find((l) => l.name === "Mariana Ruiz Salcedo");
	expect(mariana).toMatchObject({ relation: "Madre" });
	expect(mariana?.phone).toMatch(/^\d{10}$/);
	expect(mariana?.email).toContain("@example.com");
	expect(s.links.find((l) => l.name.startsWith("Javier"))?.relation).toBe(
		"Padre",
	);
	expect(s.links.some((l) => !l.phone)).toBe(true);
	expect(s.links.every((l) => l.relation)).toBe(true);
});

test("conduct records saved before date and author existed still restore", () => {
	const s = buildMockData();
	const legacy = structuredClone(s);
	legacy.conduct = legacy.conduct.map(
		({ date: _d, author: _a, ...rest }) => rest,
	);
	expect(legacy.conduct.length).toBeGreaterThan(0);
	const restored = restore(JSON.stringify(legacy));
	expect(restored?.conduct[0].date).toBeUndefined();
	expect(restored?.conduct[0].author).toBeUndefined();
	expect(restore(JSON.stringify(s))?.conduct[0].date).toMatch(
		/^2026-(0[3-9]|10)-\d{2}$/,
	);
});
