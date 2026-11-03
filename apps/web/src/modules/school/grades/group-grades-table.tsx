import { useState } from "react";
import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import { groupScope } from "../groups/group-context";
import { gradeAverage } from "../groups/group-table-helpers";
import type { ViewProps } from "../shared/view-types";
import "../shared/group-tables.css";
import "../schedule/schedule-calendar.css";

const legend = [
	["published", "Publicado"],
	["draft", "Borrador"],
	["missing", "Sin captura"],
] as const;
const number = (value: number) =>
	value.toLocaleString("es-MX", { maximumFractionDigits: 2 });

export function GroupGradesTable({
	s,
	groupId,
}: Pick<ViewProps, "s" | "open"> & { groupId: string }) {
	const scoped = groupScope(s, groupId);
	const subjects = [...new Set(scoped.assignments.map((a) => a.subject))];
	const [subject, setSubject] = useState(subjects[0] || "");
	const [period, setPeriod] = useState("");
	const assignments = scoped.assignments.filter((a) => a.subject === subject);
	const periods = [...new Set(assignments.map((a) => a.period))];
	const visible = assignments.filter((a) => !period || a.period === period);
	const mixedScales =
		new Set(assignments.map((a) => `${a.min}:${a.max}`)).size > 1;
	const columns = visible.length + (period ? 1 : 2);
	return (
		<section className="group-grades" aria-labelledby="group-grades-title">
			<header className="grades-toolbar">
				<div>
					<h2 id="group-grades-title">Calificaciones por alumno</h2>
					<p>
						{subject
							? `${subject} · ${period || "Total"}`
							: "Selecciona una materia"}
					</p>
				</div>
				<div className="grades-filters">
					<label>
						<span className="schedule-hidden">Materia</span>
						<select
							value={subject}
							onChange={(e) => {
								setSubject(e.target.value);
								setPeriod("");
							}}
						>
							{!subjects.length && <option value="">Sin materias</option>}
							{subjects.map((name) => (
								<option key={name}>{name}</option>
							))}
						</select>
					</label>
					{periods.length > 0 && (
						<fieldset className="attendance-modes">
							<legend className="schedule-hidden">Evaluación</legend>
							{["", ...periods].map((p) => (
								<button
									type="button"
									key={p || "total"}
									aria-pressed={period === p}
									onClick={() => setPeriod(p)}
								>
									{p || "Total"}
								</button>
							))}
						</fieldset>
					)}
				</div>
			</header>
			<ul className="grades-legend" aria-label="Estado de las calificaciones">
				{legend.map(([state, word]) => (
					<li key={state} data-state={state}>
						{word}
					</li>
				))}
				<li className="grades-note">Los faltantes no cuentan como cero</li>
			</ul>
			<DataTable
				caption={`Calificaciones · ${subject || "sin materia"} · ${period || "Total"}`}
				variant="card"
				scrollClassName="grades-scroll"
				scrollLabel="Calificaciones por alumno"
			>
				<thead>
					<tr>
						<th scope="col">Alumno</th>
						{visible.map((a) => (
							<th scope="col" key={a.id}>
								{a.period}
								<small>
									{a.min}–{a.max} · {a.teacher}
								</small>
							</th>
						))}
						{!period && <th scope="col">Promedio</th>}
					</tr>
				</thead>
				<tbody>
					{!assignments.length && (
						<EmptyTableRow columns={columns}>
							Este grupo aún no tiene materias. Agrégalas en la pestaña Horario.
						</EmptyTableRow>
					)}
					{assignments.length > 0 &&
						scoped.students.map((student) => {
							const avg = gradeAverage(assignments, scoped.grades, student.id);
							return (
								<tr key={student.id}>
									<th scope="row">
										{student.name}
										<small>{student.matricula}</small>
									</th>
									{visible.map((a) => {
										const grade = scoped.grades.find(
											(g) => g.student === student.id && g.assignment === a.id,
										);
										const state = grade
											? grade.published
												? "Publicado"
												: "Borrador"
											: "Sin captura";
										return (
											<td
												key={a.id}
												aria-label={`${grade ? number(grade.value) : ""} ${state}`.trim()}
											>
												<span
													className="grade-value"
													data-state={
														grade
															? grade.published
																? "published"
																: "draft"
															: "missing"
													}
													title={state}
												>
													{grade ? number(grade.value) : "—"}
												</span>
											</td>
										);
									})}
									{!period && (
										<td className="grades-average">
											<strong>
												{mixedScales || avg.value === null
													? "—"
													: number(avg.value)}
											</strong>
											{(avg.partial || avg.draft || mixedScales) && (
												<small>
													{mixedScales
														? "Escalas distintas"
														: [
																avg.partial ? "Parcial" : "",
																avg.draft ? "Con borradores" : "",
															]
																.filter(Boolean)
																.join(" · ")}
												</small>
											)}
										</td>
									)}
								</tr>
							);
						})}
					{assignments.length > 0 && !scoped.students.length && (
						<EmptyTableRow columns={columns}>
							Sin alumnos inscritos en este grupo.
						</EmptyTableRow>
					)}
				</tbody>
			</DataTable>
		</section>
	);
}
