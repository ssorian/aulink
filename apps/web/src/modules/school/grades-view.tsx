import { useState } from "react";
import { field, options, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
export function GradeRecords({
	s,
	open,
	studentName,
}: Pick<ViewProps, "s" | "open" | "studentName">) {
	return (
		<section className="panel">
			<h2>Revisar y publicar</h2>
			{s.grades.map((g) => (
				<article className="list-row" key={g.id}>
					<h3>
						{studentName(g.student)} ·{" "}
						{s.assignments.find((a) => a.id === g.assignment)?.subject}:{" "}
						{g.value}
					</h3>
					<p>
						{s.assignments.find((a) => a.id === g.assignment)?.period} ·{" "}
						{
							s.groups.find(
								(x) =>
									x.id ===
									s.assignments.find((a) => a.id === g.assignment)?.group,
							)?.name
						}{" "}
						·{" "}
						{
							s.cycles.find(
								(c) =>
									c.id ===
									s.groups.find(
										(x) =>
											x.id ===
											s.assignments.find((a) => a.id === g.assignment)?.group,
									)?.cycle,
							)?.name
						}
					</p>
					<span className="pill">{g.published ? "Publicado" : "Borrador"}</span>
					<div className="actions">
						<button
							type="button"
							onClick={() =>
								open(
									"grade",
									`Corregir calificación de ${studentName(g.student)}`,
									[field("value", "Nueva calificación", "number"), reason],
									{
										assignment: g.assignment,
										student: g.student,
										value: String(g.value),
									},
								)
							}
						>
							Corregir con motivo
						</button>
						<button
							type="button"
							disabled={g.published}
							onClick={() =>
								open(
									"grade-publish",
									`Publicar calificación de ${studentName(g.student)}`,
									[],
									{ id: g.id },
									[
										`${g.value} · ${s.assignments.find((a) => a.id === g.assignment)?.subject}`,
									],
								)
							}
						>
							Revisar publicación
						</button>
					</div>
					{g.history.map((h) => (
						<p key={h.id}>
							{h.value} · {h.reason} · {h.author}
						</p>
					))}
				</article>
			))}
			{!s.grades.length && (
				<p>
					Configura una asignación y captura alumnos inscritos para comenzar.
				</p>
			)}
		</section>
	);
}
export function GradesView({
	s,
	open,
	studentName,
}: Pick<ViewProps, "s" | "open" | "studentName">) {
	const [assignment, setAssignment] = useState("");
	const a = s.assignments.find((x) => x.id === assignment);
	return (
		<>
			<section className="panel">
				<h2>Captura por materia y periodo</h2>
				<p>
					Primero selecciona una asignación de este grupo. Sin fórmulas de
					promedio automáticas.
				</p>
				<label>
					Materia / periodo
					<select
						value={assignment}
						onChange={(e) => setAssignment(e.target.value)}
					>
						<option value="">Selecciona una asignación</option>
						{s.assignments.map((a) => (
							<option value={a.id} key={a.id}>
								{a.subject} · {a.period} · {a.teacher}
							</option>
						))}
					</select>
				</label>
				{a && (
					<>
						<p>
							Escala {a.min}–{a.max} · {a.teacher}
						</p>
						<button
							type="button"
							onClick={() =>
								open(
									"grade",
									`Capturar ${a.subject} · ${a.period}`,
									[
										options("student", "Alumno inscrito", s.students),
										field("value", "Calificación", "number"),
										{ ...reason, optional: true },
									],
									{ assignment: a.id },
									[`${a.subject} · ${a.period} · Escala ${a.min}–${a.max}`],
								)
							}
						>
							Capturar calificación
						</button>
					</>
				)}
				{!s.assignments.length && (
					<p>Agrega una asignación en Materias y horario para comenzar.</p>
				)}
			</section>
			{a && (
				<GradeRecords
					s={{ ...s, grades: s.grades.filter((g) => g.assignment === a.id) }}
					open={open}
					studentName={studentName}
				/>
			)}
		</>
	);
}
