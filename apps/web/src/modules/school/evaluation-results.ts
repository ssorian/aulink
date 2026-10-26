import type { State } from "./workflows";

export type EvaluationScale = {
	key: string;
	min: number;
	max: number;
	label: string;
};
export type EvaluationAssignment = {
	id: string;
	groupId: string;
	groupName: string;
	cycleId: string;
	cycleName: string;
	subject: string;
	period: string;
	scaleKey: string;
};
export type EvaluationRecord = EvaluationAssignment & {
	value: number;
	gradeId: string;
};
export type EvaluationData = {
	scales: EvaluationScale[];
	assignments: EvaluationAssignment[];
	records: EvaluationRecord[];
	diagnostics: { excluded: number; duplicates: number };
};
export type EvaluationFilters = {
	cycleId: string;
	scaleKey: string;
	period?: string;
	subject?: string;
};
export type EvaluationBucket = {
	key: string;
	label: string;
	mean: number | null;
	count: number;
};
export type EvaluationResultRow = {
	key: string;
	groupId: string;
	groupName: string;
	cycleId: string;
	cycleName: string;
	subject: string;
	period: string;
	scaleKey: string;
	mean: number | null;
	count: number;
};
export type EvaluationReport = {
	mean: number | null;
	count: number;
	byPeriod: EvaluationBucket[];
	byGroup: EvaluationBucket[];
	rows: EvaluationResultRow[];
};

/** Published current values only; enrollment changes do not rewrite history. */
export function buildEvaluationData(s: State): EvaluationData {
	const cycles = new Map(s.cycles.map((cycle) => [cycle.id, cycle]));
	const groups = new Map(s.groups.map((group) => [group.id, group]));
	const students = new Set(s.students.map((student) => student.id));
	const scales = new Map<string, EvaluationScale>();
	const assignments = new Map<string, EvaluationAssignment>();
	for (const item of s.assignments) {
		const group = groups.get(item.group);
		const cycle = group && cycles.get(group.cycle);
		if (
			!group ||
			!cycle ||
			!Number.isFinite(item.min) ||
			!Number.isFinite(item.max) ||
			item.max <= item.min
		)
			continue;
		const scaleKey = JSON.stringify([item.min, item.max]);
		scales.set(scaleKey, {
			key: scaleKey,
			min: item.min,
			max: item.max,
			label: `Escala ${item.min}–${item.max}`,
		});
		assignments.set(item.id, {
			id: item.id,
			groupId: group.id,
			groupName: group.name,
			cycleId: cycle.id,
			cycleName: cycle.name,
			subject: item.subject,
			period: item.period,
			scaleKey,
		});
	}
	const records: EvaluationRecord[] = [];
	const diagnostics = { excluded: 0, duplicates: 0 };
	const seen = new Set<string>();
	for (const grade of s.grades) {
		if (grade.published !== true) continue;
		const assignment = assignments.get(grade.assignment);
		const scale = assignment && scales.get(assignment.scaleKey);
		if (
			!assignment ||
			!scale ||
			!students.has(grade.student) ||
			!Number.isFinite(grade.value) ||
			grade.value < scale.min ||
			grade.value > scale.max
		) {
			diagnostics.excluded++;
			continue;
		}
		const key = JSON.stringify([grade.student, grade.assignment]);
		if (seen.has(key)) diagnostics.duplicates++;
		seen.add(key);
		records.push({ ...assignment, gradeId: grade.id, value: grade.value });
	}
	return {
		scales: [...scales.values()],
		assignments: [...assignments.values()],
		records,
		diagnostics,
	};
}

const compare = new Intl.Collator("es", { numeric: true }).compare;
const rowKey = (item: EvaluationAssignment) =>
	JSON.stringify([item.groupId, item.period, item.subject, item.scaleKey]);
type Total = { sum: number; count: number };
const mean = (total: Total) => (total.count ? total.sum / total.count : null);
function add(total: Total, value: number) {
	total.sum += value;
	total.count++;
}

/** Every aggregate is record-weighted and confined to one exact cycle/scale. */
export function summarizeEvaluation(
	data: EvaluationData,
	filters: EvaluationFilters,
): EvaluationReport {
	const matches = (item: EvaluationAssignment) =>
		item.cycleId === filters.cycleId &&
		item.scaleKey === filters.scaleKey &&
		(!filters.period || item.period === filters.period) &&
		(!filters.subject || item.subject === filters.subject);
	const rows = new Map<string, { row: EvaluationResultRow; total: Total }>();
	const periods = new Map<string, { label: string; total: Total }>();
	const groups = new Map<string, { label: string; total: Total }>();
	for (const assignment of data.assignments.filter(matches)) {
		const key = rowKey(assignment);
		if (rows.has(key)) continue;
		const { id: _id, ...fields } = assignment;
		rows.set(key, {
			row: { ...fields, key, mean: null, count: 0 },
			total: { sum: 0, count: 0 },
		});
		if (!periods.has(assignment.period))
			periods.set(assignment.period, {
				label: assignment.period,
				total: { sum: 0, count: 0 },
			});
		if (!groups.has(assignment.groupId))
			groups.set(assignment.groupId, {
				label: assignment.groupName,
				total: { sum: 0, count: 0 },
			});
	}
	const total: Total = { sum: 0, count: 0 };
	for (const record of data.records.filter(matches)) {
		const row = rows.get(rowKey(record));
		const period = periods.get(record.period);
		const group = groups.get(record.groupId);
		if (!row || !period || !group) continue;
		add(total, record.value);
		add(row.total, record.value);
		add(period.total, record.value);
		add(group.total, record.value);
	}
	const buckets = (
		items: Map<string, { label: string; total: Total }>,
	): EvaluationBucket[] =>
		[...items]
			.map(([key, item]) => ({
				key,
				label: item.label,
				mean: mean(item.total),
				count: item.total.count,
			}))
			.sort((a, b) => compare(a.label, b.label) || compare(a.key, b.key));
	return {
		mean: mean(total),
		count: total.count,
		byPeriod: buckets(periods),
		byGroup: buckets(groups),
		rows: [...rows.values()]
			.map(({ row, total }) => ({
				...row,
				mean: mean(total),
				count: total.count,
			}))
			.sort(
				(a, b) =>
					compare(a.groupName, b.groupName) ||
					compare(a.period, b.period) ||
					compare(a.subject, b.subject) ||
					compare(a.key, b.key),
			),
	};
}
