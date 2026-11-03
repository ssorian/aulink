import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { DataTable, EmptyTableRow } from "../../../components/ui/data-table";
import { MiniMonth } from "../../../components/ui/mini-month";
import { cn } from "../../../lib/utils";
import { schoolToday } from "../schedule/schedule-helpers";
import { field, reason } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import { groupScope } from "./group-context";
import { attendanceStatus, rangeDays } from "./group-table-helpers";
import {
	cellNote,
	type DotKind,
	dotFill,
	Segmented,
	StatusLegend,
	stickyFirstColumn,
	tableCells,
} from "./group-table-ui";

const modes = ["Día", "Semana", "Mes"] as const;
/** Short legend words; the full status stays in each square's accessible name. */
const legend: { key: string; kind: DotKind; label: string }[] = [
	{ key: "C", kind: "complete", label: "Entrada y salida" },
	{ key: "E", kind: "partial", label: "Sin salida" },
	{ key: "F", kind: "absent", label: "Inasistencia" },
	{ key: "?", kind: "review", label: "Por revisar" },
	{ key: "—", kind: "empty", label: "Sin registro" },
];
const squareKind = {
	C: "complete",
	E: "partial",
	F: "absent",
	"?": "review",
	"—": "none",
} as const;
const modeItems = modes.map((m) => ({ value: m, label: m }));
const codeOf = (status: string): keyof typeof squareKind =>
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
			data-slot="group-attendance"
			aria-labelledby="group-attendance-title"
			className="mt-6 grid items-start gap-5 min-[1241px]:grid-cols-[248px_minmax(0,1fr)]"
		>
			<div data-slot="attendance-main" className="min-w-0 min-[1241px]:order-2">
				<header
					data-slot="attendance-toolbar"
					className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3"
				>
					<div>
						<h2
							id="group-attendance-title"
							className="m-0 text-[22px] font-semibold tracking-tight"
						>
							Asistencia por alumno
						</h2>
						<p
							aria-live="polite"
							className="mt-0.5 text-[13px] text-muted-foreground first-letter:uppercase"
						>
							{rangeTitle(days, mode)}
						</p>
					</div>
					<Segmented
						label="Vista"
						items={modeItems}
						value={mode as (typeof modes)[number]}
						onChange={(m) => {
							setMode(m);
							setSelected(null);
						}}
					/>
				</header>
				<StatusLegend label="Significado de los colores" items={legend} />
				<DataTable
					caption={`Asistencia del grupo · ${rangeTitle(days, mode)}`}
					variant="card"
					scrollClassName={cn(
						tableCells,
						stickyFirstColumn,
						"[&_td]:text-center [&_thead_th:not(:first-child)]:text-center",
					)}
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
									className="data-[today=true]:text-primary"
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
									<small className={cellNote}>{student.matricula}</small>
								</th>
								{days.map((day) => {
									const status = attendanceStatus(
										scoped.events.filter(
											(e) => e.student === student.id && e.date === day,
										),
									);
									const code = codeOf(status);
									return (
										<td key={day}>
											<button
												type="button"
												data-slot="day-square"
												data-status={code}
												title={`${fmt(day, { weekday: "long", day: "numeric", month: "long" })}: ${status}`}
												aria-label={`${student.name} · ${day}: ${status}`}
												aria-pressed={
													selected?.student === student.id &&
													selected.date === day
												}
												onClick={() =>
													setSelected({ student: student.id, date: day })
												}
												className={cn(
													"relative inline-block size-[22px] min-h-0 min-w-0 cursor-pointer rounded-[5px] border-0 p-0 align-middle before:absolute before:-inset-[11px] before:content-[''] hover:brightness-90 aria-pressed:outline-2 aria-pressed:outline-offset-2 aria-pressed:outline-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring",
													dotFill[squareKind[code]],
												)}
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
						data-slot="attendance-detail"
						aria-label="Detalle del día"
						aria-live="polite"
						className="mt-4 pt-1"
					>
						<h3 className="m-0 mb-1 text-base font-semibold first-letter:uppercase">
							{scoped.students.find((x) => x.id === selected.student)?.name} ·{" "}
							{fmt(selected.date, {
								weekday: "long",
								day: "numeric",
								month: "long",
							})}
						</h3>
						{!events.length && (
							<p className="text-sm text-muted-foreground">
								Sin registros. No se infiere inasistencia.
							</p>
						)}
						{events.map((e) => (
							<article
								key={e.id}
								className="grid gap-2 border-b border-border py-4 last:border-b-0"
							>
								<p className="text-sm">
									Original inmutable: {e.time} · {e.kind} · ID {e.id}
								</p>
								<div>
									<Button
										size="sm"
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
									</Button>
								</div>
								{s.adjustments
									.filter((a) => a.event === e.id)
									.map((a) => (
										<p key={a.id} className="text-sm text-muted-foreground">
											Ajuste: {a.value} · Motivo: {a.reason} · Responsable:{" "}
											{a.author}
										</p>
									))}
							</article>
						))}
					</section>
				)}
			</div>
			<aside
				aria-label="Elegir periodo"
				className="min-[1241px]:order-1 max-[1240px]:max-w-80"
			>
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
