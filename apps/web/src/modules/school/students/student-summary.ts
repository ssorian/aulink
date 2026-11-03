import { average } from "../grades/grades-record";
import type { State } from "../shared/workflows";

/**
 * Grades overview of one student across the groups of one cycle (a transfer
 * keeps the grades captured in the earlier group). Only published grades count
 * toward the figures; drafts are reported separately. A subject's value is the
 * mean of its published grades across periods.
 */
export function summarizeGrades(
	s: Pick<State, "assignments" | "grades" | "evaluationRules">,
	student: string,
	groups: readonly string[],
) {
	const assignments = s.assignments.filter((a) => groups.includes(a.group));
	const subjects = [...new Set(assignments.map((a) => a.subject))];
	const own = s.grades.filter(
		(g) =>
			g.student === student && assignments.some((a) => a.id === g.assignment),
	);
	const subjectAverages = subjects
		.map((subject) =>
			average(
				own
					.filter(
						(g) =>
							g.published &&
							assignments.find((a) => a.id === g.assignment)?.subject ===
								subject,
					)
					.map((g) => g.value),
			),
		)
		.filter((value): value is number => value !== null);
	return {
		average: average(subjectAverages),
		subjects: subjects.length,
		graded: subjectAverages.length,
		failing: subjectAverages.filter((v) => v < s.evaluationRules.passing)
			.length,
		drafts: own.filter((g) => !g.published).length,
	};
}
