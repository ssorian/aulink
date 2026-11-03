import { useMemo, useState } from "react";
import { WorkspaceTabs } from "../../components/ui/workspace-tabs";
import { cyclePeriods } from "./evaluation-operations";
import { EvaluationProgress } from "./evaluation-progress";
import { buildEvaluationData } from "./evaluation-results";
import { EvaluationResultsView } from "./evaluation-results-view";
import { EvaluationRisk } from "./evaluation-risk";
import { type EvaluationPage, evaluationPages } from "./navigation";
import type { ViewProps } from "./view-types";
import type { State } from "./workflows";
import "./evaluation-dashboard.css";
import "./evaluation-workspace.css";

type Tab = EvaluationPage;
type Props = {
	s: State;
	cycleId: string;
	onCycleChange: (id: string) => void;
	onOpenGroup: (id: string) => void;
	onOpenStudent?: (id: string) => void;
	open?: ViewProps["open"];
	initialTab?: Tab;
	/** Controlled from the sidebar; hides the in-page tabs when set. */
	tab?: Tab;
};
export function EvaluationDashboard({
	s,
	cycleId,
	onCycleChange,
	onOpenGroup,
	onOpenStudent,
	open,
	initialTab = "Avance del periodo",
	tab: controlledTab,
}: Props) {
	const [ownTab, setTab] = useState<Tab>(initialTab);
	const tab = controlledTab ?? ownTab;
	const [selection, setSelection] = useState({
		cycle: cycleId,
		period: "",
		groupId: "",
		subject: "",
		grade: "",
	});
	const data = useMemo(() => buildEvaluationData(s), [s]);
	const current =
		selection.cycle === cycleId
			? selection
			: { cycle: cycleId, period: "", groupId: "", subject: "", grade: "" };
	const groups = s.groups.filter((g) => g.cycle === cycleId);
	const assignments = s.assignments.filter((a) =>
		groups.some((g) => g.id === a.group),
	);
	const periods = cyclePeriods(s, cycleId);
	const subjects = [...new Set(assignments.map((a) => a.subject))].sort(
		(a, b) => a.localeCompare(b, "es"),
	);
	const availableGroups = groups
		.filter((g) => assignments.some((a) => a.group === g.id))
		.sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }));
	const selectedPeriod = periods.includes(current.period) ? current.period : "";
	const defaultPeriod =
		[...periods]
			.reverse()
			.find((p) =>
				assignments.some(
					(a) => a.period === p && s.grades.some((g) => g.assignment === a.id),
				),
			) ||
		periods[0] ||
		"";
	const period =
		tab === "Resultados" ? selectedPeriod : selectedPeriod || defaultPeriod;
	const groupId = availableGroups.some((g) => g.id === current.groupId)
		? current.groupId
		: "";
	const subject = subjects.includes(current.subject) ? current.subject : "";
	const change = (
		field: "period" | "groupId" | "subject" | "grade",
		value: string,
	) =>
		setSelection({
			...current,
			[field]: value,
			...(field === "grade" ? { groupId: "" } : {}),
		});
	const grades = [
		...new Set(availableGroups.map((g) => g.grade).filter(Boolean)),
	] as string[];
	const grade = grades.includes(current.grade) ? current.grade : "";
	return (
		<section className="evaluation-dashboard" aria-label="Evaluación del ciclo">
			<header className="evaluation-header">
				<p>
					Seguimiento y coordinación de calificaciones para control escolar.
				</p>
				<label htmlFor="evaluation-cycle">
					Ciclo escolar
					<select
						id="evaluation-cycle"
						value={cycleId}
						disabled={!s.cycles.length}
						onChange={(e) => {
							setSelection({
								cycle: e.target.value,
								period: "",
								groupId: "",
								subject: "",
								grade: "",
							});
							onCycleChange(e.target.value);
						}}
					>
						{!s.cycles.length && (
							<option value="">Sin ciclos disponibles</option>
						)}
						{s.cycles.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
				</label>
			</header>
			{!controlledTab && (
				<WorkspaceTabs
					label="Secciones de evaluación"
					items={evaluationPages}
					value={tab}
					onChange={setTab}
				/>
			)}
			{tab === "Avance del periodo" && (
				<EvaluationProgress
					s={s}
					filters={{ cycleId, period, groupId, subject, grade }}
					options={{
						periods,
						grades,
						groups: availableGroups.filter((g) => !grade || g.grade === grade),
					}}
					onFilter={change}
					onOpenGroup={onOpenGroup}
					open={open}
				/>
			)}
			{tab === "Alumnos en riesgo" && (
				<EvaluationRisk
					s={s}
					filters={{ cycleId, period, groupId, subject, grade }}
					options={{
						periods,
						grades,
						groups: availableGroups.filter((g) => !grade || g.grade === grade),
						subjects,
					}}
					onFilter={change}
					onOpenStudent={onOpenStudent}
					onOpenGroup={onOpenGroup}
					open={open}
				/>
			)}
			{tab === "Resultados" && (
				<EvaluationResultsView
					data={data}
					cycleId={cycleId}
					cycleName={
						s.cycles.find((c) => c.id === cycleId)?.name ||
						"Sin ciclo disponible"
					}
					period={period}
					groupId={groupId}
					subject={subject}
					grade={grade}
					options={{
						periods,
						grades,
						groups: availableGroups.filter((g) => !grade || g.grade === grade),
						subjects,
					}}
					onFilter={change}
					rules={s.evaluationRules}
					onOpenGroup={onOpenGroup}
				/>
			)}
		</section>
	);
}
