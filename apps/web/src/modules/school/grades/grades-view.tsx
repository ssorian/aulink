import { useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { Select } from "../../../components/ui/field";
import { field, options, reason } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
export function GradeRecords({
	s,
	open,
	studentName,
}: Pick<ViewProps, "s" | "open" | "studentName">) {
	return (
		<Card>
			<h2 className="m-0 mb-2 text-lg font-semibold tracking-tight">
				Revisar y publicar
			</h2>
			{s.grades.map((g) => (
				<article
					data-slot="grade-record"
					className="grid gap-2 border-b border-border py-4 last:border-b-0"
					key={g.id}
				>
					<h3 className="m-0 text-base font-semibold">
						{studentName(g.student)} ·{" "}
						{s.assignments.find((a) => a.id === g.assignment)?.subject}:{" "}
						{g.value}
					</h3>
					<p className="m-0 text-sm text-muted-foreground">
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
					<Badge
						tone={g.published ? "success" : "mustard"}
						className="justify-self-start"
					>
						{g.published ? "Publicado" : "Borrador"}
					</Badge>
					<div className="flex flex-wrap gap-2">
						<Button
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
						</Button>
						<Button
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
						</Button>
					</div>
					{g.history.map((h) => (
						<p key={h.id} className="m-0 text-sm text-muted-foreground">
							{h.value} · {h.reason} · {h.author}
						</p>
					))}
				</article>
			))}
			{!s.grades.length && (
				<EmptyState
					title="Sin calificaciones"
					text="Configura una asignación y captura alumnos inscritos para comenzar."
				/>
			)}
		</Card>
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
			<Card className="grid gap-3">
				<h2 className="m-0 text-lg font-semibold tracking-tight">
					Captura por materia y periodo
				</h2>
				<p className="m-0 max-w-none text-sm text-muted-foreground">
					Primero selecciona una asignación de este grupo. Sin fórmulas de
					promedio automáticas.
				</p>
				<Select
					id="grade-assignment"
					label="Materia y periodo"
					value={assignment}
					all="Selecciona una asignación"
					items={s.assignments.map((x) => ({
						value: x.id,
						label: `${x.subject} · ${x.period} · ${x.teacher}`,
					}))}
					onChange={setAssignment}
					className="flex-none"
				/>
				{a && (
					<>
						<p className="m-0 text-sm text-muted-foreground">
							Escala {a.min}–{a.max} · {a.teacher}
						</p>
						<Button
							className="justify-self-start"
							variant="primary"
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
						</Button>
					</>
				)}
				{!s.assignments.length && (
					<p className="m-0 text-sm text-muted-foreground">
						Agrega una asignación en Materias y horario para comenzar.
					</p>
				)}
			</Card>
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
