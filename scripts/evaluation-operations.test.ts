import { expect, test } from "bun:test";
import {
	buildPeriodProgress,
	buildRiskReport,
	groupProgress,
	riskDistribution,
} from "../apps/web/src/modules/school/evaluation/evaluation-operations";
import {
	apply,
	initialState,
	restore,
	type State,
} from "../apps/web/src/modules/school/shared/workflows";

const run = (s: State, kind: string, data: Record<string, string>) =>
	apply(s, { kind, data });

function fixture() {
	const s = initialState();
	s.students.push({
		id: "s3",
		name: "Bruno Ejemplo",
		matricula: "AUR-26003",
		enrollments: [{ group: "g1", cycle: "c1" }],
	});
	const assignment = (
		id: string,
		group: string,
		subject: string,
		teacher: string,
		period: string,
	) => ({ id, group, subject, teacher, period, min: 0, max: 10 });
	s.assignments = [
		assignment("m1", "g1", "Matemáticas", "Docente A", "P1"),
		assignment("l1", "g1", "Lengua", "Docente B", "P1"),
		assignment("m2", "g2", "Matemáticas", "Docente A", "P1"),
		assignment("m1b", "g1", "Matemáticas", "Docente A", "P2"),
	];
	const grade = (
		id: string,
		assignment: string,
		student: string,
		value: number,
		published: boolean,
	) => ({ id, assignment, student, value, published, history: [] });
	s.grades = [
		grade("s1-m1", "m1", "s1", 5, true),
		grade("s1-l1", "l1", "s1", 4, false),
		grade("s3-m1", "m1", "s3", 9, false),
		grade("s1-m1b", "m1b", "s1", 8, true),
	];
	return s;
}

test("group summaries count only assigned subjects and complete groups", () => {
	const report = buildPeriodProgress(fixture(), {
		cycleId: "c1",
		period: "P1",
	});
	expect(groupProgress(report.groups[0])).toEqual({
		expected: 4,
		published: 1,
		draft: 2,
		missing: 1,
		complete: false,
	});
	expect(groupProgress({ ...report.groups[0], cells: new Map() })).toEqual({
		expected: 0,
		published: 0,
		draft: 0,
		missing: 0,
		complete: false,
	});
});

test("risk distribution includes zero through three-plus failures and highlights the threshold", () => {
	expect(riskDistribution([0, 1, 2, 3, 4], 2)).toEqual([
		{ label: "0", count: 1, risk: false },
		{ label: "1", count: 1, risk: false },
		{ label: "2", count: 1, risk: true },
		{ label: "3+", count: 2, risk: true },
	]);
	expect(riskDistribution([], 1).map((bucket) => bucket.count)).toEqual([
		0, 0, 0, 0,
	]);
	expect(riskDistribution([3, 4], 4)[3].risk).toBe(true);
	expect(riskDistribution([3], 4)[3].risk).toBe(false);
});

test("evaluation rules default to passing 6 and two failed subjects, and survive restore", () => {
	const s = initialState();
	expect(s.evaluationRules).toEqual({ passing: 6, riskSubjects: 2 });
	const legacy = JSON.parse(JSON.stringify(s));
	delete legacy.evaluationRules;
	expect(restore(JSON.stringify(legacy))?.evaluationRules).toEqual({
		passing: 6,
		riskSubjects: 2,
	});
});

test("evaluation-rules updates both values and rejects invalid input without changes", () => {
	const s = initialState();
	const next = run(s, "evaluation-rules", { passing: "7", riskSubjects: "1" });
	expect(next.evaluationRules).toEqual({ passing: 7, riskSubjects: 1 });
	const before = JSON.stringify(s);
	for (const data of [
		{ passing: "", riskSubjects: "2" },
		{ passing: "-1", riskSubjects: "2" },
		{ passing: "6", riskSubjects: "0" },
		{ passing: "6", riskSubjects: "1.5" },
		{ passing: "abc", riskSubjects: "2" },
	])
		expect(() => run(s, "evaluation-rules", data)).toThrow();
	expect(JSON.stringify(s)).toBe(before);
});

test("grade-publish-batch publishes every listed draft at once", () => {
	const s = fixture();
	const next = run(s, "grade-publish-batch", { ids: "s1-l1,s3-m1" });
	expect(next.grades.filter((g) => g.published).map((g) => g.id)).toEqual([
		"s1-m1",
		"s1-l1",
		"s3-m1",
		"s1-m1b",
	]);
	expect(s.grades.find((g) => g.id === "s1-l1")?.published).toBe(false);
});

test("grade-publish-batch is atomic: unknown, published or empty lists change nothing", () => {
	const s = fixture();
	const before = JSON.stringify(s);
	expect(() => run(s, "grade-publish-batch", { ids: "s1-l1,s1-m1" })).toThrow(
		"Solo se pueden publicar calificaciones en borrador.",
	);
	expect(() => run(s, "grade-publish-batch", { ids: "s1-l1,nope" })).toThrow(
		"Solo se pueden publicar calificaciones en borrador.",
	);
	expect(() => run(s, "grade-publish-batch", { ids: "" })).toThrow();
	expect(JSON.stringify(s)).toBe(before);
});

test("period progress counts expected, published, draft and missing per group and subject", () => {
	const progress = buildPeriodProgress(fixture(), {
		cycleId: "c1",
		period: "P1",
	});
	expect(progress.periods).toEqual(["P1", "P2"]);
	expect(progress.subjects).toEqual(["Lengua", "Matemáticas"]);
	expect(progress.groups.map((g) => g.name)).toEqual(["1° A", "2° B"]);
	const g1 = progress.groups[0];
	expect(g1.cells.get("Matemáticas")).toMatchObject({
		teacher: "Docente A",
		expected: 2,
		published: 1,
		draft: 1,
		missing: 0,
	});
	expect(g1.cells.get("Lengua")).toMatchObject({
		teacher: "Docente B",
		expected: 2,
		published: 0,
		draft: 1,
		missing: 1,
	});
	expect(progress.groups[1].cells.get("Lengua")).toBeUndefined();
	expect(progress.groups[1].cells.get("Matemáticas")).toMatchObject({
		expected: 1,
		missing: 1,
	});
	expect(progress.totals).toEqual({
		expected: 5,
		published: 1,
		draft: 2,
		missing: 2,
	});
	expect([...progress.draftIds].sort()).toEqual(["s1-l1", "s3-m1"]);
});

test("period progress groups pending work by teacher and honors group and subject filters", () => {
	const s = fixture();
	const progress = buildPeriodProgress(s, { cycleId: "c1", period: "P1" });
	expect(
		progress.teachers.map(({ teacher, draft, missing, cells }) => ({
			teacher,
			draft,
			missing,
			cells: cells.length,
		})),
	).toEqual([
		{ teacher: "Docente A", draft: 1, missing: 1, cells: 2 },
		{ teacher: "Docente B", draft: 1, missing: 1, cells: 1 },
	]);
	const scoped = buildPeriodProgress(s, {
		cycleId: "c1",
		period: "P1",
		groupId: "g1",
		subject: "Matemáticas",
	});
	expect(scoped.totals).toEqual({
		expected: 2,
		published: 1,
		draft: 1,
		missing: 0,
	});
	expect(scoped.draftIds).toEqual(["s3-m1"]);
	expect(
		buildPeriodProgress(s, { cycleId: "c1", period: "P2" }).totals,
	).toEqual({ expected: 2, published: 1, draft: 0, missing: 1 });
});

test("level filtering scopes groups and teacher totals", () => {
	const s = fixture();
	s.groups[1].grade = "1 semestre";
	const report = buildPeriodProgress(s, {
		cycleId: "c1",
		period: "P1",
		level: "Media superior",
	});
	expect(report.groups.map((group) => group.id)).toEqual(["g2"]);
	expect(report.totals).toEqual({
		expected: 1,
		published: 0,
		draft: 0,
		missing: 1,
	});
});

test("risk orders equal failure counts by lowest grade", () => {
	const s = fixture();
	s.grades.push({
		...s.grades[0],
		id: "s3-l1",
		assignment: "l1",
		student: "s3",
		value: 2,
	});
	const report = buildRiskReport(
		s,
		{ passing: 10, riskSubjects: 2 },
		{ cycleId: "c1", period: "P1" },
	);
	expect(report.students.map((student) => student.studentId)).toEqual([
		"s3",
		"s1",
	]);
});

test("risk lists students reaching the configured failed-subject count, drafts flagged", () => {
	const s = fixture();
	const filters = { cycleId: "c1", period: "P1" };
	const risk = buildRiskReport(s, s.evaluationRules, filters);
	expect(risk.students).toHaveLength(1);
	expect(risk.students[0]).toMatchObject({
		studentId: "s1",
		groupName: "1° A",
		failed: [
			{ subject: "Lengua", value: 4, published: false },
			{ subject: "Matemáticas", value: 5, published: true },
		],
	});
	expect(risk.withFailures).toBe(1);
	expect(
		buildRiskReport(s, { passing: 6, riskSubjects: 3 }, filters).students,
	).toEqual([]);
	const strict = buildRiskReport(s, { passing: 10, riskSubjects: 1 }, filters);
	expect(strict.students.map((x) => x.studentId)).toEqual(["s1", "s3"]);
	expect(
		buildRiskReport(
			s,
			{ passing: 6, riskSubjects: 1 },
			{
				...filters,
				groupId: "g2",
			},
		).students,
	).toEqual([]);
});
test("period progress can be confined to one grade", () => {
	const s = initialState();
	s.assignments = [
		{ id: "x", group: "g1", period: "P1", subject: "A", teacher: "T", min: 0, max: 10 },
		{ id: "y", group: "g2", period: "P1", subject: "B", teacher: "U", min: 0, max: 10 },
	];
	s.grades = [];
	const report = buildPeriodProgress(s, { cycleId: "c1", period: "P1", grade: "2°" });
	expect(report.groups.map((g) => g.id)).toEqual(["g2"]);
	expect(report.subjects).toEqual(["B"]);
});
