import { useState } from "react";
import { groupScope } from "./group-context";
import { attendanceStatus, rangeDays } from "./group-table-helpers";
import { field, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
import "./group-tables.css";
export function GroupAttendanceTable({
	s,
	open,
	groupId,
	initialDate,
	initialMode = "Semana",
}: Pick<ViewProps, "s" | "open"> & {
	groupId: string;
	initialDate?: string;
	initialMode?: string;
}) {
	const scoped = groupScope(s, groupId);
	const [date, setDate] = useState(
		() =>
			initialDate ||
			scoped.events
				.map((e) => e.date)
				.sort()
				.at(-1) ||
			new Date().toISOString().slice(0, 10),
	);
	const [mode, setMode] = useState(initialMode);
	const [selected, setSelected] = useState<{
		student: string;
		date: string;
	} | null>(null);
	const days = rangeDays(date, mode);
	const events = selected
		? scoped.events.filter(
				(e) => e.student === selected.student && e.date === selected.date,
			)
		: [];
	return (
		<section className="panel group-tables">
			<h2>Asistencia por alumno</h2>
			<div className="filters">
				<label>
					Vista
					<select
						value={mode}
						onChange={(e) => {
							setMode(e.target.value);
							setSelected(null);
						}}
					>
						{["Día", "Semana", "Mes"].map((m) => (
							<option key={m}>{m}</option>
						))}
					</select>
				</label>
				<label>
					Fecha
					<input
						type="date"
						value={date}
						onChange={(e) => {
							setDate(e.target.value);
							setSelected(null);
						}}
					/>
				</label>
			</div>
			<p>
				Un cuadro por día. E: entrada sin salida (amarillo); C: entrada y salida
				en orden (verde); F: inasistencia explícita (rojo); —: sin registros; ?:
				pendiente de revisión (gris). Sin lecturas no significa falta, tampoco
				en días futuros o inhábiles. Los ajustes conservan la evidencia original
				y no se interpretan automáticamente.
			</p>
			<section
				className="group-table-scroll"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: El contenedor de tabla necesita foco para desplazamiento horizontal y vertical con teclado.
				tabIndex={0}
				aria-label="Asistencia por alumno y día"
			>
				<table>
					<caption>Historial del grupo y ciclo · {mode}</caption>
					<thead>
						<tr>
							<th scope="col">Alumno</th>
							{days.map((day) => (
								<th scope="col" key={day}>
									{day.slice(5)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{scoped.students.map((student) => (
							<tr key={student.id}>
								<th scope="row">
									{student.name}
									<small>{student.matricula}</small>
								</th>
								{days.map((day) => {
									const evidence = scoped.events.filter(
										(e) => e.student === student.id && e.date === day,
									);
									const status = attendanceStatus(evidence);
									const code =
										status === "Entrada y salida"
											? "C"
											: status === "Entrada sin salida"
												? "E"
												: status === "Inasistencia explícita"
													? "F"
													: status === "Sin registros"
														? "—"
														: "?";
									return (
										<td key={day}>
											<button
												type="button"
												className="day-square"
												data-status={code}
												aria-label={`${student.name} · ${day}: ${status}`}
												aria-pressed={
													selected?.student === student.id &&
													selected.date === day
												}
												onClick={() =>
													setSelected({ student: student.id, date: day })
												}
											>
												{code}
											</button>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</section>
			{!scoped.students.length && <p>Sin alumnos inscritos en este grupo.</p>}
			{selected && (
				<section aria-label="Detalle del día" aria-live="polite">
					<h3>
						{scoped.students.find((x) => x.id === selected.student)?.name} ·{" "}
						{selected.date}
					</h3>
					{!events.length && <p>Sin registros. No se infiere inasistencia.</p>}
					{events.map((e) => (
						<article className="list-row" key={e.id}>
							<p>
								Original inmutable: {e.time} · {e.kind} · ID {e.id}
							</p>
							<button
								type="button"
								onClick={() =>
									open(
										"adjust",
										`Justificar / corregir ${e.id}`,
										[field("value", "Resultado del ajuste"), reason],
										{ event: e.id },
									)
								}
							>
								Justificar / corregir con motivo
							</button>
							{s.adjustments
								.filter((a) => a.event === e.id)
								.map((a) => (
									<p key={a.id}>
										Ajuste: {a.value} · Motivo: {a.reason} · Responsable:{" "}
										{a.author}
									</p>
								))}
						</article>
					))}
				</section>
			)}
		</section>
	);
}
