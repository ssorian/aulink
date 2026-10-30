import { buildRiskReport, type PeriodFilters } from "./evaluation-operations";
import type { ViewProps } from "./view-types";
import type { State } from "./workflows";

export function EvaluationRisk({
	s,
	filters,
	onOpenStudent,
	open,
}: {
	s: State;
	filters: PeriodFilters;
	onOpenStudent?: (id: string) => void;
	open?: ViewProps["open"];
}) {
	const rules = s.evaluationRules;
	const report = buildRiskReport(s, rules, filters);
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
			<p className="evaluation-risk-summary">
				{report.students.length} alumnos en riesgo · {report.withFailures} con
				al menos una materia reprobada · {report.evaluated} evaluados
			</p>
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
									<td data-label="Grupo">{row.groupName}</td>
									<td data-label="Materias reprobadas">
										<ul>
											{row.failed.map((f, i) => (
												// biome-ignore lint/suspicious/noArrayIndexKey: Duplicate subject assignments can produce identical entries.
												<li key={`${f.subject}-${i}`}>
													{f.subject} {f.value}
													{!f.published && " (borrador)"}
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
							? `${report.withFailures} alumnos tienen al menos una materia reprobada.`
							: "No hay alumnos que cumplan el criterio en esta selección."}
					</p>
				</div>
			)}
			<p className="evaluation-workspace-note">
				Se incluyen borradores señalados como tales; las familias solo ven
				calificaciones publicadas.
			</p>
		</section>
	);
}
