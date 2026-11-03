import { useState } from "react";
import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import { Select } from "../../../components/ui/field";
import { Legend, type LegendItem } from "../../../components/ui/legend";
import { cn } from "../../../lib/utils";
import { groupScope } from "../groups/group-context";
import { gradeAverage } from "../groups/group-table-helpers";
import {
	cellNote,
	dotFill,
	Segmented,
	stickyFirstColumn,
	tableCells,
} from "../groups/group-table-ui";
import type { ViewProps } from "../shared/view-types";

const legend: LegendItem[] = [
	{ id: "published", tone: "success", label: "Publicado" },
	{ id: "draft", tone: "mustard", label: "Borrador" },
	{ id: "missing", tone: "neutral", label: "Sin captura", hollow: true },
];
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
		<section
			data-slot="group-grades"
			aria-labelledby="group-grades-title"
			className="mt-6 min-w-0"
		>
			<header
				data-slot="grades-toolbar"
				className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3"
			>
				<div>
					<h2
						id="group-grades-title"
						className="m-0 text-[22px] font-semibold tracking-tight"
					>
						Calificaciones por alumno
					</h2>
					<p className="mt-0.5 text-[13px] text-muted-foreground">
						{subject
							? `${subject} · ${period || "Total"}`
							: "Selecciona una materia"}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2 max-sm:w-full max-sm:flex-col max-sm:items-stretch">
					<Select
						id="group-grades-subject"
						label="Materia"
						value={subject}
						items={subjects.map((name) => ({ value: name, label: name }))}
						onChange={(value) => {
							setSubject(value);
							setPeriod("");
						}}
						className="min-w-56 flex-none"
					/>
					{periods.length > 0 && (
						<Segmented
							label="Evaluación"
							items={["", ...periods].map((p) => ({
								value: p,
								label: p || "Total",
							}))}
							value={period}
							onChange={setPeriod}
						/>
					)}
				</div>
			</header>
			<div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
				<Legend
					hook="data-state"
					label="Estado de las calificaciones"
					items={legend}
				/>
				<p className="m-0 sm:ml-auto">Los faltantes no cuentan como cero</p>
			</div>
			<DataTable
				caption={`Calificaciones · ${subject || "sin materia"} · ${period || "Total"}`}
				variant="card"
				scrollClassName={cn(tableCells, stickyFirstColumn)}
				scrollLabel="Calificaciones por alumno"
			>
				<thead>
					<tr>
						<th scope="col">Alumno</th>
						{visible.map((a) => (
							<th scope="col" key={a.id}>
								{a.period}
								<small className={cellNote}>
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
										<small className={cellNote}>{student.matricula}</small>
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
													data-slot="grade-value"
													data-state={
														grade
															? grade.published
																? "published"
																: "draft"
															: "missing"
													}
													title={state}
													className={cn(
														"inline-flex items-center gap-2 text-[15px] font-semibold",
														!grade && "font-normal text-muted-foreground",
													)}
												>
													<span
														aria-hidden="true"
														className={cn(
															"size-2 shrink-0 rounded-full",
															dotFill[
																grade
																	? grade.published
																		? "complete"
																		: "partial"
																	: "empty"
															],
														)}
													/>
													{grade ? number(grade.value) : "—"}
												</span>
											</td>
										);
									})}
									{!period && (
										<td>
											<strong className="text-[15px]">
												{mixedScales || avg.value === null
													? "—"
													: number(avg.value)}
											</strong>
											{(avg.partial || avg.draft || mixedScales) && (
												<small className={cellNote}>
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
