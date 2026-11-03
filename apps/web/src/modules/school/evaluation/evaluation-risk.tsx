import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import { Select } from "../../../components/ui/field";
import { FilterBar } from "../../../components/ui/filter-bar";
import { Stat, StatGrid } from "../../../components/ui/stat";
import { toneSurface } from "../../../components/ui/tone";
import { cn } from "../../../lib/utils";
import type { ViewProps } from "../shared/view-types";
import type { State } from "../shared/workflows";
import { buildRiskReport, type PeriodFilters } from "./evaluation-operations";
import {
	ActionNote,
	filterFieldClass,
	filterRowClass,
	SectionHeading,
	statClass,
	tableScroll,
} from "./evaluation-parts";

type Filter = "period" | "groupId" | "subject" | "grade";

export function EvaluationRisk({
	s,
	filters: requested,
	options,
	onFilter,
	onOpenStudent,
	onOpenGroup,
	open,
}: {
	s: State;
	filters: PeriodFilters;
	options: {
		periods: string[];
		grades: string[];
		groups: State["groups"];
		subjects: string[];
	};
	onFilter: (field: Filter, value: string) => void;
	onOpenStudent?: (id: string) => void;
	onOpenGroup?: (id: string) => void;
	open?: ViewProps["open"];
}) {
	const filters: PeriodFilters = {
		...requested,
		groupId: options.groups.some((g) => g.id === requested.groupId)
			? requested.groupId
			: "",
		subject: options.subjects.includes(requested.subject || "")
			? requested.subject
			: "",
	};
	const rules = s.evaluationRules;
	const report = buildRiskReport(s, rules, filters);
	const columns = onOpenStudent ? 5 : 4;
	const stats = [
		["risk", "En riesgo", report.students.length, "brick"],
		["failed", "Con alguna reprobada", report.withFailures, "mustard"],
		["evaluated", "Evaluados", report.evaluated, "teal"],
	] as const;
	return (
		<section data-slot="evaluation-risk" className="mt-2">
			<SectionHeading
				title={`Riesgo de ${filters.period || "periodo"}`}
				description={`En riesgo: ${rules.riskSubjects} o más materias con calificación menor a ${rules.passing}.`}
			>
				<div>
					<Button
						variant="default"
						size="sm"
						className="min-h-11 rounded-sm border-border bg-transparent px-3 py-2 text-[13px] text-primary"
						disabled={!open}
						onClick={() =>
							open?.(
								"evaluation-rules",
								"Criterio de riesgo",
								[
									{
										key: "passing",
										label: "Calificación mínima aprobatoria",
										type: "number",
									},
									{
										key: "riskSubjects",
										label: "Materias reprobadas para considerar riesgo",
										type: "number",
									},
								],
								{
									passing: String(rules.passing),
									riskSubjects: String(rules.riskSubjects),
								},
								undefined,
								"Este criterio aplica a todos los grupos y periodos.",
							)
						}
					>
						Cambiar criterio
					</Button>
					{!open && (
						<ActionNote>La configuración no está disponible.</ActionNote>
					)}
				</div>
			</SectionHeading>
			<Card
				data-slot="risk-stats"
				aria-label="Resumen de riesgo"
				padding="none"
				className="px-5.5 py-5"
			>
				<StatGrid className="grid-cols-2 md:grid-cols-[repeat(3,minmax(0,0.7fr))_minmax(0,1.4fr)]">
					{stats.map(([key, label, count, tone]) => (
						<Stat
							key={key}
							tone={tone}
							label={label}
							value={count}
							className={statClass}
						/>
					))}
					<div
						data-slot="stat"
						data-state="distribution"
						className={cn(
							"col-span-full px-3.5 py-3 md:col-span-1",
							"rounded-lg",
							toneSurface.lilac,
						)}
					>
						<dt className="text-[13px] font-semibold [hyphens:auto]">
							Materias reprobadas
						</dt>
						<dd className="m-0">
							<ul className="m-0 mt-1 flex w-full list-none gap-1.5 p-0">
								{report.distribution.map((bucket) => (
									<li
										key={bucket.label}
										data-risk={bucket.risk}
										className={cn(
											"grid flex-1 justify-items-center gap-0.5 rounded-lg py-1 leading-[1.5]",
											bucket.risk
												? toneSurface.brick
												: "bg-card text-lilac-ink",
										)}
									>
										<span className="text-xs font-semibold">
											{bucket.label}
										</span>
										<strong className="text-[13px]">{bucket.count}</strong>
									</li>
								))}
							</ul>
						</dd>
					</div>
				</StatGrid>
				<p className="sr-only">
					{report.students.length}{" "}
					{report.students.length === 1 ? "alumno" : "alumnos"} en riesgo ·{" "}
					{report.withFailures} con al menos una materia reprobada ·{" "}
					{report.evaluated} {report.evaluated === 1 ? "evaluado" : "evaluados"}
				</p>
			</Card>
			<FilterBar label="Filtros de riesgo" className={filterRowClass}>
				<Select
					id="risk-grade"
					className={filterFieldClass}
					label="Grado"
					value={filters.grade || ""}
					all="Todos"
					items={options.grades.map((g) => ({ value: g, label: g }))}
					onChange={(v) => onFilter("grade", v)}
				/>
				<Select
					id="risk-group"
					className={filterFieldClass}
					label="Grupo"
					value={filters.groupId || ""}
					all="Todos"
					items={options.groups.map((g) => ({ value: g.id, label: g.name }))}
					onChange={(v) => onFilter("groupId", v)}
				/>
				<Select
					id="risk-period"
					className={filterFieldClass}
					label="Trimestre"
					value={filters.period}
					items={options.periods.map((p) => ({ value: p, label: p }))}
					onChange={(v) => onFilter("period", v)}
				/>
				<Select
					id="risk-subject"
					className={filterFieldClass}
					label="Materia"
					value={filters.subject || ""}
					all="Todas"
					items={options.subjects.map((x) => ({ value: x, label: x }))}
					onChange={(v) => onFilter("subject", v)}
				/>
			</FilterBar>
			<ul
				data-slot="legend"
				aria-label="Calificaciones reprobadas"
				className="m-0 -mt-0.5 mb-3 flex list-none flex-wrap gap-x-4.5 gap-y-1.5 p-0 text-[13px] text-muted-foreground"
			>
				<li data-state="published" className="inline-flex items-center gap-1.5">
					<span
						aria-hidden="true"
						className="size-2 shrink-0 rounded-full bg-brick"
					/>
					Publicada
				</li>
				<li data-state="draft" className="inline-flex items-center gap-1.5">
					<span
						aria-hidden="true"
						className="size-2 shrink-0 rounded-full ring-[1.5px] ring-brick ring-inset"
					/>
					Borrador, aún no visible para familias
				</li>
			</ul>
			<DataTable
				caption="Alumnos en riesgo"
				variant="card"
				scrollClassName={tableScroll(
					"[&_table]:min-w-[680px] [&_th]:text-left [&_td]:text-left [&_tbody_td:nth-child(3)]:whitespace-normal",
				)}
				scrollLabel="Alumnos en riesgo"
			>
				<thead>
					<tr>
						<th scope="col">Alumno</th>
						<th scope="col">Grupo</th>
						<th scope="col">Materias reprobadas</th>
						<th scope="col">Sin capturar</th>
						{onOpenStudent && <th scope="col">Acción</th>}
					</tr>
				</thead>
				<tbody>
					{!report.students.length && (
						<EmptyTableRow columns={columns}>
							<strong className="text-[15px] text-foreground">
								Ningún alumno cumple el criterio
							</strong>
							<br />
							{report.withFailures > 0
								? `${report.withFailures} ${report.withFailures === 1 ? "alumno tiene" : "alumnos tienen"} al menos una materia reprobada.`
								: "No hay alumnos que cumplan el criterio en esta selección."}
						</EmptyTableRow>
					)}
					{report.students.map((row) => (
						<tr key={row.studentId}>
							<th scope="row">{row.name}</th>
							<td>
								{onOpenGroup ? (
									<Button
										variant="link"
										className="min-h-9 text-sm font-[650] whitespace-nowrap"
										onClick={() => onOpenGroup(row.groupId)}
									>
										{row.groupName}
									</Button>
								) : (
									row.groupName
								)}
							</td>
							<td>
								<ul className="m-0 flex list-none flex-wrap gap-1 p-0 whitespace-normal">
									{row.failed.map((f, i) => (
										<li
											// biome-ignore lint/suspicious/noArrayIndexKey: Duplicate subject assignments can produce identical entries.
											key={`${f.subject}-${i}`}
											data-state={f.published ? "published" : "draft"}
											className={cn(
												"rounded-full px-2.5 py-0.5 text-[13px] leading-[1.6] font-semibold whitespace-nowrap",
												f.published
													? toneSurface.brick
													: "bg-transparent text-brick-ink ring-1 ring-brick ring-inset",
											)}
										>
											{f.subject} {f.value}
											{!f.published && (
												<>
													{" "}
													· <span data-slot="draft-tag">borrador</span>
												</>
											)}
										</li>
									))}
								</ul>
							</td>
							<td>{row.missing}</td>
							{onOpenStudent && (
								<td>
									<Button
										size="sm"
										className="min-h-9 max-md:min-h-11 rounded-sm border-border bg-transparent px-3 py-0 text-[13px] whitespace-nowrap text-primary"
										onClick={() => onOpenStudent(row.studentId)}
									>
										Ver expediente
									</Button>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</DataTable>
		</section>
	);
}
