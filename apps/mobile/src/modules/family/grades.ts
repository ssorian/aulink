export const evaluationOptions = [
  { id: 'total', label: 'Total', shortLabel: 'Total' },
  { id: 'evaluation-1', label: 'Evaluación 1', shortLabel: 'Eval. 1' },
  { id: 'evaluation-2', label: 'Evaluación 2', shortLabel: 'Eval. 2' },
  { id: 'evaluation-3', label: 'Evaluación 3', shortLabel: 'Eval. 3' },
] as const;

export type GradeFilter = typeof evaluationOptions[number]['id'];
export type EvaluationId = Exclude<GradeFilter, 'total'>;
export type GradeSubject = {
  subject: string;
  evaluations: Partial<Record<EvaluationId, { value: number; published: boolean }>>;
};

/** Tutor totals include published values only; missing grades never count as zero. */
export function gradeSummary(subject: GradeSubject, filter: GradeFilter) {
  const ids: EvaluationId[] = filter === 'total'
    ? evaluationOptions.flatMap(option => option.id === 'total' ? [] : [option.id])
    : [filter];
  const values = ids.flatMap(id => {
    const grade = subject.evaluations[id];
    return grade?.published && Number.isFinite(grade.value) && grade.value >= 0 && grade.value <= 10
      ? [grade.value] : [];
  });
  return {
    value: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) / 10 : null,
    count: values.length,
    expected: ids.length,
    partial: values.length > 0 && values.length < ids.length,
  };
}
