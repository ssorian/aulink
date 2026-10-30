import { useState } from "react";
import {
	buildPeriodProgress,
	buildRiskReport,
	type PeriodFilters,
} from "./evaluation-operations";
import { educationLevel } from "./evaluation-results";

type Level = "Todos" | "Secundaria" | "Media superior";

import type { ViewProps } from "./view-types";
import type { State } from "./workflows";

export function EvaluationRisk({
	s,
	filters,
	onOpenStudent,
	onOpenGroup,
	open,
}: {
	s: State;
	filters: PeriodFilters;
	onOpenStudent?: (id: string) => void;
	onOpenGroup?: (id: string) => void;
	open?: ViewProps["open"];
}) {
	const [selectedLevel, setSelectedLevel] = useState<Level>("Todos");
	const levels = [
		...new Set(
			buildPeriodProgress(s, filters)
				.groups.filter((group) => group.cells.size)
				.map((group) =>
					educationLevel(s.groups.find((item) => item.id === group.id)?.grade),
				),
		),
	];
	const level =
		levels.length > 1 &&
		levels.includes(selectedLevel as Exclude<Level, "Todos">)
			? selectedLevel
			: "Todos";
	const rules = s.evaluationRules;
	const report = buildRiskReport(
		s,
		rules,
		level === "Todos" ? filters : { ...filters, level },
	);
	return (
		<section className="evaluation-risk">
			<div className="evaluation-section-heading">
				<div>
					<h2>Alumnos en riesgo</h2>
					<p>
						En riesgo: {rules.riskSubjects} o más materias con calificación
						menor a {rules.passing}.
					</p>
				</div>
				<div className="evaluation-heading-controls">
					{levels.length > 1 && ( // biome-ignore lint/a11y/useSemanticElements: Pressed buttons form a compact segmented control.
						<div
							className="results-segment"
							role="group"
							aria-label="Nivel educativo"
						>
							{(["Todos", "Secundaria", "Media superior"] as Level[]).map(
								(item) => (
									<button
										type="button"
										key={item}
										aria-pressed={level === item}
										onClick={() => setSelectedLevel(item)}
									>
										{item}
									</button>
								),
							)}
						</div>
					)}
					<div>
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
				</div>
			</div>
			<dl
				className="results-kpis evaluation-operation-kpis"
				aria-label="Resumen de riesgo"
			>
				{(
					[
						["En riesgo", report.students.length, "danger"],
						["Con alguna reprobada", report.withFailures, "warning"],
						["Evaluados", report.evaluated, "neutral"],
					] as const
				).map(([label, count, tone]) => (
					<div key={label}>
						<dt className={`eval-stat-label--${tone}`}>{label}</dt>
						<dd>
							<strong>{count}</strong>
						</dd>
					</div>
				))}
				<div className="evaluation-distribution">
					<dt>Materias reprobadas</dt>
					<dd>
						<div className="evaluation-distribution-bar" aria-hidden="true">
							{report.distribution.map((bucket) => (
								<span
									key={bucket.label}
									className={bucket.risk ? "is-risk" : ""}
									style={{ flex: bucket.count }}
								/>
							))}
						</div>
						<ul>
							{report.distribution.map((bucket) => (
								<li key={bucket.label}>
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
			<div className="eval-panel evaluation-risk-panel">
				{report.students.length ? (
					<div className="evaluation-risk-table">
						<table>
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
								{report.students.map((row) => (
									<tr key={row.studentId}>
										<th scope="row" data-label="Alumno">
											{row.name}
											<small>{row.matricula}</small>
										</th>
										<td data-label="Grupo">
											{onOpenGroup ? (
												<button
													type="button"
													className="evaluation-group-link"
													onClick={() => onOpenGroup(row.groupId)}
												>
													{row.groupName}
												</button>
											) : (
												row.groupName
											)}
											{level === "Todos" && levels.length > 1 && (
												<small>
													{educationLevel(
														s.groups.find((group) => group.id === row.groupId)
															?.grade,
													)}
												</small>
											)}
										</td>
										<td data-label="Materias reprobadas">
											<ul>
												{row.failed.map((f, i) => (
													<li
														// biome-ignore lint/suspicious/noArrayIndexKey: Duplicate subject assignments can produce identical entries.
														key={`${f.subject}-${i}`}
														className={`eval-pill eval-pill--danger${!f.published ? " eval-pill--draft" : ""}`}
													>
														{f.subject} {f.value}
														{!f.published && (
															<>
																{" "}
																·{" "}
																<span className="evaluation-draft-tag">
																	borrador
																</span>
															</>
														)}
													</li>
												))}
											</ul>
										</td>
										<td data-label="Sin capturar">{row.missing}</td>
										{onOpenStudent && (
											<td data-label="Acción">
												<button
													type="button"
													onClick={() => onOpenStudent(row.studentId)}
												>
													Ver expediente
												</button>
											</td>
										)}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="evaluation-empty">
						<h3>Ningún alumno cumple el criterio</h3>
						<p>
							{report.withFailures > 0
								? `${report.withFailures} ${report.withFailures === 1 ? "alumno tiene" : "alumnos tienen"} al menos una materia reprobada.`
								: "No hay alumnos que cumplan el criterio en esta selección."}
						</p>
					</div>
				)}
			</div>
			<p className="evaluation-workspace-note">
				Se incluyen borradores señalados como tales; las familias solo ven
				calificaciones publicadas.
			</p>
		</section>
	);
}
