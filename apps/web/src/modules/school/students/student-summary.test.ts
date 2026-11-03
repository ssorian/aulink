// @ts-expect-error Bun runs these tests; browser compilation excludes its types.
import { expect, test } from "bun:test";
import { summarizeGrades } from "./student-summary";

const assignment = (
	id: string,
	subject: string,
	period: string,
	group = "g",
) => ({
	id,
	subject,
	teacher: "T",
	period,
	group,
	min: 0,
	max: 10,
});
const grade = (
	assignmentId: string,
	value: number,
	published: boolean,
	student = "s",
) => ({
	id: `gr-${assignmentId}-${student}`,
	assignment: assignmentId,
	student,
	value,
	published,
	history: [],
});
const rules = { passing: 6, riskSubjects: 2 };

test("averages published grades per subject, then across subjects", () => {
	const summary = summarizeGrades(
		{
			assignments: [
				assignment("a1", "Español", "P1"),
				assignment("a2", "Español", "P2"),
				assignment("a3", "Historia", "P1"),
			],
			grades: [
				grade("a1", 8, true),
				grade("a2", 10, true),
				grade("a3", 5, true),
			],
			evaluationRules: rules,
		},
		"s",
		["g"],
	);
	expect(summary).toEqual({
		average: 7,
		subjects: 2,
		graded: 2,
		failing: 1,
		drafts: 0,
	});
});

test("drafts never enter the average and are counted", () => {
	const summary = summarizeGrades(
		{
			assignments: [
				assignment("a1", "Español", "P1"),
				assignment("a2", "Arte", "P1"),
			],
			grades: [grade("a1", 9, true), grade("a2", 2, false)],
			evaluationRules: rules,
		},
		"s",
		["g"],
	);
	expect(summary).toMatchObject({
		average: 9,
		graded: 1,
		subjects: 2,
		failing: 0,
		drafts: 1,
	});
});

test("no published grades yields a null average, not zero", () => {
	const summary = summarizeGrades(
		{
			assignments: [assignment("a1", "Español", "P1")],
			grades: [grade("a1", 9, false)],
			evaluationRules: rules,
		},
		"s",
		["g"],
	);
	expect(summary.average).toBeNull();
	expect(summary.graded).toBe(0);
	expect(summary.failing).toBe(0);
	expect(summary.drafts).toBe(1);
});

test("ignores other students and other groups", () => {
	const summary = summarizeGrades(
		{
			assignments: [
				assignment("a1", "Español", "P1"),
				assignment("b1", "Otra", "P1", "other"),
			],
			grades: [
				grade("a1", 8, true),
				grade("a1", 1, true, "x"),
				grade("b1", 3, true),
			],
			evaluationRules: rules,
		},
		"s",
		["g"],
	);
	expect(summary).toMatchObject({ average: 8, subjects: 1, graded: 1 });
});

test("no groups means nothing to summarize", () => {
	const summary = summarizeGrades(
		{
			assignments: [assignment("a1", "Español", "P1")],
			grades: [grade("a1", 8, true)],
			evaluationRules: rules,
		},
		"s",
		[],
	);
	expect(summary).toEqual({
		average: null,
		subjects: 0,
		graded: 0,
		failing: 0,
		drafts: 0,
	});
});

test("grades captured before a transfer still count for the cycle", () => {
	const summary = summarizeGrades(
		{
			assignments: [
				assignment("a1", "Español", "P1", "old"),
				assignment("a2", "Español", "P1", "new"),
			],
			grades: [grade("a1", 8, true)],
			evaluationRules: rules,
		},
		"s",
		["old", "new"],
	);
	expect(summary).toMatchObject({ average: 8, subjects: 1, graded: 1 });
});
