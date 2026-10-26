// @ts-expect-error Bun runs these tests; browser compilation excludes its types.
import { expect, test } from "bun:test";
import { buildEvaluationData, summarizeEvaluation } from "./evaluation-results";
import { initialState, type State } from "./workflows";

const scaleKey = "[0,10]";
function assignment(
	id: string,
	group = "g1",
	period = "P1",
	subject = "Mate",
	max = 10,
): State["assignments"][number] {
	return { id, group, period, subject, min: 0, max, teacher: "Docente" };
}
function grade(
	id: string,
	assignmentId: string,
	value: number,
	published = true,
	student = "s1",
): State["grades"][number] {
	return {
		id,
		assignment: assignmentId,
		value,
		published,
		student,
		history: [],
	};
}
function fixture(): State {
	const s = initialState();
	s.cycles.push({ id: "c2", name: "2027–2028" });
	s.groups.push({ id: "g3", name: "10° A", cycle: "c2" });
	s.assignments = [
		assignment("a1"),
		assignment("a2", "g2"),
		assignment("empty", "g1", "P2", "Arte"),
		assignment("percent", "g1", "P1", "Mate", 100),
		assignment("next", "g3"),
	];
	s.grades = [
		grade("zero", "a1", 0),
		grade("ten", "a1", 10, true, "s2"),
		grade("eight", "a2", 8),
		grade("draft", "empty", 7, false),
		grade("percent-grade", "percent", 90),
		grade("next-grade", "next", 9),
	];
	return s;
}

test("school means weight records, isolate cycle and scale, and preserve zero", () => {
	const data = buildEvaluationData(fixture());
	const report = summarizeEvaluation(data, { cycleId: "c1", scaleKey });
	expect(report.count).toBe(3);
	expect(report.mean).toBe(6);
	expect(report.byGroup.map((b) => [b.key, b.mean, b.count])).toEqual([
		["g1", 5, 2],
		["g2", 8, 1],
	]);
	expect(report.byPeriod.map((b) => [b.key, b.mean, b.count])).toEqual([
		["P1", 6, 3],
		["P2", null, 0],
	]);
	expect(data.scales).toEqual([
		{ key: scaleKey, min: 0, max: 10, label: "Escala 0–10" },
		{ key: "[0,100]", min: 0, max: 100, label: "Escala 0–100" },
	]);
	expect(
		summarizeEvaluation(data, { cycleId: "c1", scaleKey: "[0,100]" }).mean,
	).toBe(90);
	expect(summarizeEvaluation(data, { cycleId: "c2", scaleKey }).mean).toBe(9);
});

test("seeds absent and draft-only assignments and combines optional filters", () => {
	const data = buildEvaluationData(fixture());
	const report = summarizeEvaluation(data, {
		cycleId: "c1",
		scaleKey,
		period: "P2",
		subject: "Arte",
	});
	expect(report.mean).toBeNull();
	expect(report.count).toBe(0);
	expect(report.rows).toHaveLength(1);
	expect(report.rows[0]).toMatchObject({
		groupId: "g1",
		cycleId: "c1",
		cycleName: "2026–2027",
		subject: "Arte",
		period: "P2",
		mean: null,
		count: 0,
	});
	expect(report.byGroup).toEqual([
		{ key: "g1", label: "1° A", mean: null, count: 0 },
	]);
	const s = fixture();
	s.grades = [];
	expect(
		summarizeEvaluation(buildEvaluationData(s), { cycleId: "c1", scaleKey })
			.rows,
	).toHaveLength(3);
	expect(
		summarizeEvaluation(data, {
			cycleId: "c1",
			scaleKey,
			period: "",
			subject: "",
		}),
	).toEqual(summarizeEvaluation(data, { cycleId: "c1", scaleKey }));
});

test("stale or missing required filters never fall back", () => {
	const data = buildEvaluationData(fixture());
	for (const filters of [
		{ cycleId: "", scaleKey },
		{ cycleId: "missing", scaleKey },
		{ cycleId: "c1", scaleKey: "" },
		{ cycleId: "c1", scaleKey: "[1,10]" },
		{ cycleId: "c1", scaleKey, period: "missing" },
		{ cycleId: "c1", scaleKey, subject: "missing" },
	]) {
		expect(summarizeEvaluation(data, filters)).toEqual({
			mean: null,
			count: 0,
			rows: [],
			byGroup: [],
			byPeriod: [],
		});
	}
});

test("corrected current values and historical assignment groups survive transfers", () => {
	const s = fixture();
	s.students[0].enrollments = [{ group: "g3", cycle: "c2" }];
	s.grades = [grade("corrected", "a1", 4)];
	s.grades[0].history = [
		{ id: "old", reason: "Corrección", value: "10", author: "Docente" },
	];
	const data = buildEvaluationData(s);
	expect(data.records).toHaveLength(1);
	expect(data.records[0]).toMatchObject({
		id: "a1",
		gradeId: "corrected",
		groupId: "g1",
		cycleId: "c1",
		value: 4,
	});
	expect(summarizeEvaluation(data, { cycleId: "c1", scaleKey }).mean).toBe(4);
});

test("diagnoses only invalid published grades and retains every valid duplicate", () => {
	const s = fixture();
	s.groups.push({ id: "broken-cycle", name: "X", cycle: "missing" });
	s.assignments.push(
		assignment("bad-group", "missing"),
		assignment("bad-cycle", "broken-cycle"),
		{ ...assignment("degenerate"), min: 10 },
		{ ...assignment("infinite"), max: Infinity },
		{ ...assignment("nan"), min: NaN },
		{ ...assignment("reversed"), min: 11 },
	);
	s.grades = [
		grade("one", "a1", 0),
		grade("two", "a1", 10),
		grade("three", "a1", 5),
		grade("student", "a1", 3, true, "missing"),
		grade("assignment", "missing", 3),
		...[
			"bad-group",
			"bad-cycle",
			"degenerate",
			"infinite",
			"nan",
			"reversed",
		].map((id) => grade(id, id, 3)),
		...[NaN, Infinity, -Infinity, -1, 11].map((value, i) =>
			grade(`invalid-${i}`, "a1", value),
		),
		grade("invalid-draft", "missing", NaN, false),
	];
	const data = buildEvaluationData(s);
	expect(data.diagnostics).toEqual({ excluded: 13, duplicates: 2 });
	expect(data.assignments).toHaveLength(5);
	expect(data.scales).toHaveLength(2);
	expect(data.records.map((r) => r.gradeId)).toEqual(["one", "two", "three"]);
	expect(summarizeEvaluation(data, { cycleId: "c1", scaleKey }).mean).toBe(5);
});

test("rows combine assignments by tuple without delimiter collisions and sort numerically", () => {
	const s = fixture();
	s.groups[0].name = "Grupo 10";
	s.groups[1].name = "Grupo 2";
	s.assignments = [
		assignment("a", "g1", "P10"),
		assignment("b", "g1", "P2"),
		assignment("c", "g2", "P1"),
		assignment("d", "g1", "P2"),
		assignment("e", "g1", "a|b", "c"),
		assignment("f", "g1", "a", "b|c"),
	];
	s.grades = [grade("a", "b", 2), grade("b", "d", 6)];
	const report = summarizeEvaluation(buildEvaluationData(s), {
		cycleId: "c1",
		scaleKey,
	});
	expect(report.rows).toHaveLength(5);
	expect(new Set(report.rows.map((r) => r.key)).size).toBe(5);
	expect(report.rows[0].groupId).toBe("g2");
	expect(
		report.rows.filter((r) => r.period.startsWith("P")).map((r) => r.period),
	).toEqual(["P1", "P2", "P10"]);
	expect(report.rows.find((r) => r.period === "P2")).toMatchObject({
		mean: 4,
		count: 2,
	});
});

test("does not mutate state or derived data across repeated reports", () => {
	const s = fixture();
	const before = structuredClone(s);
	const freeze = (value: object) => {
		Object.freeze(value);
		for (const child of Object.values(value))
			if (child && typeof child === "object") freeze(child);
	};
	freeze(s);
	const data = buildEvaluationData(s);
	const snapshot = structuredClone(data);
	freeze(data);
	const filters = { cycleId: "c1", scaleKey };
	expect(summarizeEvaluation(data, filters)).toEqual(
		summarizeEvaluation(data, filters),
	);
	expect(s).toEqual(before);
	expect(data).toEqual(snapshot);
});
