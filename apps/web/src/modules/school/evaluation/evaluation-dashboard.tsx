import { useMemo, useState } from "react";
import { WorkspaceTabs } from "../../../components/ui/workspace-tabs";
import type { ViewProps } from "../shared/view-types";
import type { State } from "../shared/workflows";
import { type EvaluationPage, evaluationPages } from "../shell/navigation";
import { cyclePeriods } from "./evaluation-operations";
import { EvaluationProgress } from "./evaluation-progress";
import { buildEvaluationData } from "./evaluation-results";
import { EvaluationResultsView } from "./evaluation-results-view";
import { EvaluationRisk } from "./evaluation-risk";

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
		<section
			data-slot="evaluation-dashboard"
			className="max-w-full min-w-0 text-foreground tabular-nums selection:bg-selection selection:text-foreground"
			aria-label="Evaluación del ciclo"
		>
			<header className="flex items-center justify-between gap-6 max-md:flex-col max-md:items-start max-md:gap-4">
				<p className="max-w-[72ch] text-[13px] leading-[1.6] text-muted-foreground">
					Seguimiento y coordinación de calificaciones para control escolar.
				</p>
				<label
					htmlFor="evaluation-cycle"
					className="flex flex-row items-center gap-2 text-[13px] font-semibold whitespace-nowrap text-foreground"
				>
					Ciclo escolar
					<select
						id="evaluation-cycle"
						className="min-h-9 w-auto min-w-0 rounded-sm border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:bg-background disabled:text-muted-foreground"
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
