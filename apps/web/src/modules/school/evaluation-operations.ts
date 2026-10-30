import { enrolledStudents } from "./group-context";
import type { State } from "./workflows";

export type EvaluationRules = State["evaluationRules"];
export type PeriodFilters = {
	cycleId: string;
	period: string;
	groupId?: string;
	subject?: string;
};
export type ProgressCounts = {
	expected: number;
	published: number;
	draft: number;
	missing: number;
};
export type ProgressCell = ProgressCounts & {
	groupId: string;
	groupName: string;
	subject: string;
	teacher: string;
	draftIds: string[];
};
export type RiskStudent = {
	studentId: string;
	name: string;
	matricula: string;
	groupId: string;
	groupName: string;
	failed: { subject: string; value: number; published: boolean }[];
	missing: number;
};

const compare = new Intl.Collator("es", { numeric: true }).compare;
const empty = (): ProgressCounts => ({
	expected: 0,
	published: 0,
	draft: 0,
	missing: 0,
});
function addCounts(total: ProgressCounts, item: ProgressCounts) {
	total.expected += item.expected;
	total.published += item.published;
	total.draft += item.draft;
	total.missing += item.missing;
}

/** Periods in the cycle, in the order they were first configured. */
export function cyclePeriods(s: State, cycleId: string) {
	const groups = new Set(
		s.groups.filter((g) => g.cycle === cycleId).map((g) => g.id),
	);
	return [
		...new Set(
			s.assignments.filter((a) => groups.has(a.group)).map((a) => a.period),
		),
	];
}

/** Assignments of one cycle and period with each expected student's current grade. */
function periodScope(s: State, filters: PeriodFilters) {
	return s.groups
		.filter(
			(g) =>
				g.cycle === filters.cycleId &&
				(!filters.groupId || g.id === filters.groupId),
		)
		.sort((a, b) => compare(a.name, b.name))
		.map((group) => {
			const students = enrolledStudents(s, group.id);
			const assignments = s.assignments
				.filter(
					(a) =>
						a.group === group.id &&
						a.period === filters.period &&
						(!filters.subject || a.subject === filters.subject),
				)
				.map((assignment) => ({
					assignment,
					entries: students.map((student) => ({
						student,
						grade: s.grades.find(
							(g) => g.assignment === assignment.id && g.student === student.id,
						),
					})),
				}));
			return { group, assignments };
		});
}

/** Capture and publication state; a missing grade is never counted as zero. */
export function buildPeriodProgress(s: State, filters: PeriodFilters) {
	const totals = empty();
	const draftIds: string[] = [];
	const subjects = new Set<string>();
	const teachers = new Map<
		string,
		ProgressCounts & { teacher: string; cells: ProgressCell[] }
	>();
	const groups = periodScope(s, filters).map(({ group, assignments }) => {
		const cells = new Map<string, ProgressCell>();
		for (const { assignment, entries } of assignments) {
			const cell: ProgressCell = cells.get(assignment.subject) || {
				...empty(),
				groupId: group.id,
				groupName: group.name,
				subject: assignment.subject,
				teacher: assignment.teacher,
				draftIds: [],
			};
			for (const { grade } of entries) {
				cell.expected++;
				if (!grade) cell.missing++;
				else if (grade.published) cell.published++;
				else {
					cell.draft++;
					cell.draftIds.push(grade.id);
				}
			}
			cells.set(assignment.subject, cell);
			subjects.add(assignment.subject);
		}
		for (const cell of cells.values()) {
			addCounts(totals, cell);
			draftIds.push(...cell.draftIds);
			const teacher = teachers.get(cell.teacher) || {
				...empty(),
				teacher: cell.teacher,
				cells: [],
			};
			addCounts(teacher, cell);
			teacher.cells.push(cell);
			teachers.set(cell.teacher, teacher);
		}
		return { id: group.id, name: group.name, cells };
	});
	return {
		periods: cyclePeriods(s, filters.cycleId),
		subjects: [...subjects].sort(compare),
		groups,
		totals,
		draftIds,
		teachers: [...teachers.values()].sort(
			(a, b) =>
				b.missing + b.draft - (a.missing + a.draft) ||
				compare(a.teacher, b.teacher),
		),
	};
}

/** Students whose captured grades (published or draft) fail the configured count of subjects. */
export function buildRiskReport(
	s: State,
	rules: EvaluationRules,
	filters: PeriodFilters,
) {
	const students = new Map<string, RiskStudent>();
	for (const { group, assignments } of periodScope(s, filters))
		for (const { assignment, entries } of assignments)
			for (const { student, grade } of entries) {
				const row = students.get(student.id) || {
					studentId: student.id,
					name: student.name,
					matricula: student.matricula,
					groupId: group.id,
					groupName: group.name,
					failed: [],
					missing: 0,
				};
				if (!grade) row.missing++;
				else if (grade.value < rules.passing)
					row.failed.push({
						subject: assignment.subject,
						value: grade.value,
						published: grade.published,
					});
				students.set(student.id, row);
			}
	const rows = [...students.values()];
	for (const row of rows)
		row.failed.sort((a, b) => compare(a.subject, b.subject));
	return {
		evaluated: rows.length,
		withFailures: rows.filter((row) => row.failed.length > 0).length,
		students: rows
			.filter((row) => row.failed.length >= rules.riskSubjects)
			.sort(
				(a, b) =>
					b.failed.length - a.failed.length ||
					compare(a.groupName, b.groupName) ||
					compare(a.name, b.name),
			),
	};
}
