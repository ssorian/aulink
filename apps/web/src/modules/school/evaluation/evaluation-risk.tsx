import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import { buildRiskReport, type PeriodFilters } from "./evaluation-operations";
import { Select } from "./evaluation-progress";
import type { ViewProps } from "../shared/view-types";
import type { State } from "../shared/workflows";
import "../shared/group-tables.css";

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
		["risk", "En riesgo", report.students.length],
		["failed", "Con alguna reprobada", report.withFailures],
		["evaluated", "Evaluados", report.evaluated],
	] as const;
	return (
		<section className="evaluation-progress evaluation-risk">
			<header className="progress-heading">
				<div>
					<h2>Riesgo de {filters.period || "periodo"}</h2>
					<p>
						En riesgo: {rules.riskSubjects} o más materias con calificación
						menor a {rules.passing}.
					</p>
				</div>
				<div className="progress-publish">
					<button
						type="button"
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
					</button>
					{!open && <small>La configuración no está disponible.</small>}
				</div>
			</header>
			<section
				className="progress-card progress-stats risk-stats"
				aria-label="Resumen de riesgo"
			>
				<dl>
					{stats.map(([key, label, count]) => (
						<div key={key} data-state={key}>
							<dt>{label}</dt>
							<dd>
								<strong>{count}</strong>
							</dd>
						</div>
					))}
					<div data-state="distribution" className="evaluation-distribution">
						<dt>Materias reprobadas</dt>
						<dd>
							<ul>
								{report.distribution.map((bucket) => (
									<li key={bucket.label} data-risk={bucket.risk}>
										<span>{bucket.label}</span>
										<strong>{bucket.count}</strong>
									</li>
								))}
							</ul>
						</dd>
					</div>
				</dl>
				<p className="evaluation-risk-summary evaluation-sr-only">
					{report.students.length}{" "}
					{report.students.length === 1 ? "alumno" : "alumnos"} en riesgo ·{" "}
					{report.withFailures} con al menos una materia reprobada ·{" "}
					{report.evaluated} {report.evaluated === 1 ? "evaluado" : "evaluados"}
				</p>
			</section>
			<div className="progress-filters">
				<Select
					id="risk-grade"
					label="Grado"
					value={filters.grade || ""}
					all="Todos"
					items={options.grades.map((g) => ({ value: g, label: g }))}
					onChange={(v) => onFilter("grade", v)}
				/>
				<Select
					id="risk-group"
					label="Grupo"
					value={filters.groupId || ""}
					all="Todos"
					items={options.groups.map((g) => ({ value: g.id, label: g.name }))}
					onChange={(v) => onFilter("groupId", v)}
				/>
				<Select
					id="risk-period"
					label="Trimestre"
					value={filters.period}
					items={options.periods.map((p) => ({ value: p, label: p }))}
					onChange={(v) => onFilter("period", v)}
				/>
				<Select
					id="risk-subject"
					label="Materia"
					value={filters.subject || ""}
					all="Todas"
					items={options.subjects.map((x) => ({ value: x, label: x }))}
					onChange={(v) => onFilter("subject", v)}
				/>
			</div>
			<ul
				className="grades-legend risk-legend"
				aria-label="Calificaciones reprobadas"
			>
				<li data-state="published">Publicada</li>
				<li data-state="draft">Borrador, aún no visible para familias</li>
			</ul>
			<DataTable
				caption="Alumnos en riesgo"
				variant="card"
				scrollClassName="grades-scroll risk-scroll"
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
							<strong>Ningún alumno cumple el criterio</strong>
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
									<button
										type="button"
										className="progress-group-link"
										onClick={() => onOpenGroup(row.groupId)}
									>
										{row.groupName}
									</button>
								) : (
									row.groupName
								)}
							</td>
							<td>
								<ul className="risk-failed">
									{row.failed.map((f, i) => (
										<li
											// biome-ignore lint/suspicious/noArrayIndexKey: Duplicate subject assignments can produce identical entries.
											key={`${f.subject}-${i}`}
											data-state={f.published ? "published" : "draft"}
										>
											{f.subject} {f.value}
											{!f.published && (
												<>
													{" "}
													·{" "}
													<span className="evaluation-draft-tag">borrador</span>
												</>
											)}
										</li>
									))}
								</ul>
							</td>
							<td>{row.missing}</td>
							{onOpenStudent && (
								<td>
									<button
										type="button"
										className="risk-open"
										onClick={() => onOpenStudent(row.studentId)}
									>
										Ver expediente
									</button>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</DataTable>
		</section>
	);
}
