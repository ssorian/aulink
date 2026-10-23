import { useState } from "react";
import { groupScope } from "./group-context";
import { gradeAverage } from "./group-table-helpers";
import { GradeRecords } from "./grades-view";
import { field, options, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
import { activeGroup } from "./workflows";
import "./group-tables.css";
export function GroupGradesTable({
	s,
	open,
	groupId,
}: Pick<ViewProps, "s" | "open"> & { groupId: string }) {
	const scoped = groupScope(s, groupId);
	const subjects = [...new Set(scoped.assignments.map((a) => a.subject))];
	const [subject, setSubject] = useState(subjects[0] || "");
	const [period, setPeriod] = useState("");
	const assignments = scoped.assignments.filter((a) => a.subject === subject);
	const visible = assignments.filter((a) => !period || a.period === period);
	const group = scoped.groups[0];
	return (
		<section className="panel group-tables">
			<h2>Calificaciones por alumno</h2>
			<div className="filters">
				<label>
					Materia
					<select
						value={subject}
						onChange={(e) => {
							setSubject(e.target.value);
							setPeriod("");
						}}
					>
						<option value="">Selecciona materia</option>
						{subjects.map((name) => (
							<option key={name}>{name}</option>
						))}
					</select>
				</label>
				<label>
					Evaluación
					<select value={period} onChange={(e) => setPeriod(e.target.value)}>
						<option value="">Total</option>
						{[...new Set(assignments.map((a) => a.period))].map((p) => (
							<option key={p}>{p}</option>
						))}
					</select>
				</label>
			</div>
			<p>
				Promedio simple por materia, solo con la misma escala. Los faltantes no
				valen cero. Parcial indica evaluaciones sin captura; los borradores se
				incluyen y se identifican.
			</p>
			{!assignments.length ? (
				<p>
					Selecciona una materia; configura asignaciones en Horario si aún no
					existen.
				</p>
			) : (
				<>
					<section
						className="group-table-scroll"
						// biome-ignore lint/a11y/noNoninteractiveTabindex: El contenedor de tabla necesita foco para desplazamiento horizontal y vertical con teclado.
						tabIndex={0}
						aria-label="Calificaciones por alumno"
					>
						<table>
							<caption>
								{subject} · {period || "Total"}
							</caption>
							<thead>
								<tr>
									<th scope="col">Alumno</th>
									{visible.map((a) => (
										<th scope="col" key={a.id}>
											{a.period}
											<small>
												Escala {a.min}–{a.max} · {a.teacher}
											</small>
										</th>
									))}
									{!period && <th scope="col">Promedio</th>}
								</tr>
							</thead>
							<tbody>
								{scoped.students.map((student) => {
									const avg = gradeAverage(
										assignments,
										scoped.grades,
										student.id,
									);
									return (
										<tr key={student.id}>
											<th scope="row">
												{student.name}
												<small>{student.matricula}</small>
											</th>
											{visible.map((a) => {
												const grade = scoped.grades.find(
													(g) =>
														g.student === student.id && g.assignment === a.id,
												);
												return (
													<td key={a.id}>
														{grade ? (
															<>
																{grade.value}
																<small>
																	{grade.published ? "Publicado" : "Borrador"}
																</small>
															</>
														) : (
															"Sin captura"
														)}
													</td>
												);
											})}
											{!period && (
												<td>
													{avg.value === null
														? "Sin promedio"
														: avg.value.toLocaleString("es-MX", {
																maximumFractionDigits: 2,
															})}
													<small>
														{avg.partial ? "Parcial" : "Completo"}
														{avg.draft ? " · Incluye borradores" : ""}
													</small>
													{new Set(assignments.map((a) => `${a.min}:${a.max}`))
														.size > 1 && (
														<small>Escalas distintas: no se promedian</small>
													)}
												</td>
											)}
										</tr>
									);
								})}
							</tbody>
						</table>
					</section>
					<div className="actions">
						{visible.map((a) => (
							<button
								key={a.id}
								type="button"
								onClick={() =>
									open(
										"grade",
										`Capturar ${a.subject} · ${a.period}`,
										[
											options(
												"student",
												"Alumno activo",
												scoped.students.filter(
													(x) => activeGroup(s, x.id, group.cycle) === groupId,
												),
											),
											field("value", "Calificación", "number"),
											{ ...reason, optional: true },
										],
										{ assignment: a.id },
										[`Escala ${a.min}–${a.max}`],
									)
								}
							>
								Capturar {a.period}
							</button>
						))}
					</div>
					<details>
						<summary>Auditoría, publicación y correcciones con motivo</summary>
						<GradeRecords
							s={{
								...scoped,
								grades: scoped.grades.filter((g) =>
									visible.some((a) => a.id === g.assignment),
								),
							}}
							open={open}
							studentName={(id) =>
								s.students.find((x) => x.id === id)?.name || id
							}
						/>
					</details>
				</>
			)}
		</section>
	);
}
