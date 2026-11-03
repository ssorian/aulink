import { useState } from "react";
import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import { groupScope } from "./group-context";
import { attendanceStatus, rangeDays } from "./group-table-helpers";
import { schoolToday } from "../schedule/schedule-helpers";
import { MiniMonth } from "../schedule/schedule-sidebar";
import { field, reason } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import "../shared/group-tables.css";
import "../schedule/schedule-calendar.css";

const modes = ["Día", "Semana", "Mes"] as const;
/** Short legend words; the full status stays in each square's accessible name. */
const legend = [
	["C", "Entrada y salida"],
	["E", "Sin salida"],
	["F", "Inasistencia"],
	["?", "Por revisar"],
	["—", "Sin registro"],
] as const;
const codeOf = (status: string) =>
	status === "Entrada y salida"
		? "C"
		: status === "Entrada sin salida"
			? "E"
			: status === "Inasistencia explícita"
				? "F"
				: status === "Sin registros"
					? "—"
					: "?";
const fmt = (date: string, options: Intl.DateTimeFormatOptions) =>
	new Intl.DateTimeFormat("es-MX", { ...options, timeZone: "UTC" })
		.format(new Date(`${date}T12:00:00Z`))
		.replace(/\./g, "");
function rangeTitle(days: string[], mode: string) {
	if (!days.length) return "";
	if (mode === "Día")
		return fmt(days[0], {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	if (mode === "Mes") return fmt(days[0], { month: "long", year: "numeric" });
	const last = days.at(-1) || days[0];
	const sameMonth = days[0].slice(0, 7) === last.slice(0, 7);
	return `${fmt(days[0], sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" })} – ${fmt(last, { day: "numeric", month: "short", year: "numeric" })}`;
}

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
	const heading = (day: string) =>
		mode === "Mes"
			? String(Number(day.slice(8)))
			: fmt(day, { weekday: "short", day: "numeric" });
	return (
		<section
			className="group-attendance"
			aria-labelledby="group-attendance-title"
		>
			<div className="attendance-main">
				<header className="attendance-toolbar">
					<div>
						<h2 id="group-attendance-title">Asistencia por alumno</h2>
						<p aria-live="polite">{rangeTitle(days, mode)}</p>
					</div>
					<fieldset className="attendance-modes">
						<legend className="schedule-hidden">Vista</legend>
						{modes.map((m) => (
							<button
								type="button"
								key={m}
								aria-pressed={mode === m}
								onClick={() => {
									setMode(m);
									setSelected(null);
								}}
							>
								{m}
							</button>
						))}
					</fieldset>
				</header>
				<ul
					className="attendance-legend"
					aria-label="Significado de los colores"
				>
					{legend.map(([code, word]) => (
						<li key={code} data-status={code}>
							{word}
						</li>
					))}
				</ul>
				<DataTable
					caption={`Asistencia del grupo · ${rangeTitle(days, mode)}`}
					variant="card"
					scrollClassName="attendance-scroll"
					scrollLabel="Asistencia por alumno y día"
				>
					<thead>
						<tr>
							<th scope="col">Alumno</th>
							{days.map((day) => (
								<th
									scope="col"
									key={day}
									data-today={day === schoolToday(s.school.timezone)}
								>
									{heading(day)}
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
									const status = attendanceStatus(
										scoped.events.filter(
											(e) => e.student === student.id && e.date === day,
										),
									);
									return (
										<td key={day}>
											<button
												type="button"
												className="day-square"
												data-status={codeOf(status)}
												title={`${fmt(day, { weekday: "long", day: "numeric", month: "long" })}: ${status}`}
												aria-label={`${student.name} · ${day}: ${status}`}
												aria-pressed={
													selected?.student === student.id &&
													selected.date === day
												}
												onClick={() =>
													setSelected({ student: student.id, date: day })
												}
											/>
										</td>
									);
								})}
							</tr>
						))}
						{!scoped.students.length && (
							<EmptyTableRow columns={days.length + 1}>
								Sin alumnos inscritos en este grupo.
							</EmptyTableRow>
						)}
					</tbody>
				</DataTable>
				{selected && (
					<section
						className="attendance-detail"
						aria-label="Detalle del día"
						aria-live="polite"
					>
						<h3>
							{scoped.students.find((x) => x.id === selected.student)?.name} ·{" "}
							{fmt(selected.date, {
								weekday: "long",
								day: "numeric",
								month: "long",
							})}
						</h3>
						{!events.length && (
							<p>Sin registros. No se infiere inasistencia.</p>
						)}
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
			</div>
			<aside className="attendance-aside" aria-label="Elegir periodo">
				<MiniMonth
					selected={date}
					today={schoolToday(s.school.timezone)}
					label="Elegir fecha"
					legend={false}
					inRange={(day) => days.includes(day)}
					onSelect={(day) => {
						setDate(day);
						setSelected(null);
					}}
				/>
			</aside>
		</section>
	);
}
