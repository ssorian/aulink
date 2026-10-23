import { useId, useState } from "react";
import type { ViewProps } from "./view-types";
import type { State } from "./workflows";
import { field, options, reason } from "./view-helpers";
import {
	addDays,
	dayWindow,
	minutes,
	occurrences,
	schoolToday,
	validDate,
	weekday,
	weekdays,
	type Occurrence,
} from "./schedule-helpers";
import "./schedule-calendar.css";

const disclaimer =
	"Solo simulación local; no se comunica a terminales ni autoriza entrega de menores";
const statusLabels = {
	active: "Programada",
	cancel: "Cancelada",
	move: "Reagendada · origen",
	moved: "Reagendada · destino",
};
export function ScheduleCalendar({
	s,
	groupId,
	open,
}: {
	s: State;
	groupId: string;
	open: ViewProps["open"];
}) {
	const headingId = useId();
	const today = schoolToday(s.school.timezone);
	const [selectedDate, setSelectedDate] = useState(today);
	const monday = addDays(
		selectedDate,
		-((new Date(`${selectedDate}T12:00:00Z`).getUTCDay() + 6) % 7),
	);
	const dates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
	const assignments = s.assignments.filter((a) => a.group === groupId);
	const slots = s.schedules.filter((slot) =>
		assignments.some((a) => a.id === slot.assignment),
	);
	const days = dates.map((date) => ({
		date,
		items: occurrences(s, groupId, date),
		holiday: s.exceptions.find((e) => e.date === date),
	}));
	const all = days.flatMap((day) => day.items);
	const startHour = Math.min(
		7,
		...all.map((o) => Math.floor(minutes(o.start) / 60)),
	);
	const endHour = Math.max(
		15,
		...all.map((o) => Math.ceil(minutes(o.end) / 60)),
	);
	const hours = Array.from(
		{ length: endHour - startHour + 1 },
		(_, i) => startHour + i,
	);
	const selected = days.find((day) => day.date === selectedDate) ?? {
		date: selectedDate,
		items: occurrences(s, groupId, selectedDate),
		holiday: s.exceptions.find((exception) => exception.date === selectedDate),
	};
	const config = s.scheduleWindows.find((w) => w.group === groupId) || {
		before: 0,
		after: 0,
	};
	const name = (id: string) =>
		assignments.find((a) => a.id === id)?.subject || "Materia";
	function schedule(slot?: State["schedules"][number]) {
		open(
			"schedule",
			slot ? "Editar recurrencia semanal" : "Agendar clase semanal",
			[
				options(
					"assignment",
					"Materia / asignación",
					assignments.map((a) => ({
						id: a.id,
						name: `${a.subject} · ${a.teacher} · ${a.period}`,
					})),
				),
				options(
					"day",
					"Día de la semana",
					[...weekdays.slice(1), weekdays[0]].map((day) => ({
						id: day,
						name: day,
					})),
				),
				field("start", "Inicio", "time"),
				field("end", "Fin", "time"),
			],
			{
				group: groupId,
				assignment: slot?.assignment || assignments[0]?.id || "",
				day: slot?.day || "Lunes",
				start: slot?.start || "08:00",
				end: slot?.end || "09:00",
				...(slot ? { id: slot.id } : {}),
			},
			[
				"Se repetirá cada semana. No se permiten cruces de medianoche ni clases superpuestas.",
			],
			"Una serie con excepciones registradas se conserva: usa Reagendar clase para cambiar una fecha.",
		);
	}
	function occurrence(item: Occurrence, action: "cancel" | "move" | "restore") {
		const title =
			action === "cancel"
				? "Cancelar clase"
				: action === "move"
					? "Reagendar clase"
					: "Restaurar ocurrencia";
		open(
			"schedule-occurrence",
			`${title} · ${name(item.assignment)} · ${item.originDate}`,
			[
				...(action === "move"
					? [
							field("targetDate", "Fecha destino", "date"),
							field("start", "Nuevo inicio", "time"),
							field("end", "Nuevo fin", "time"),
						]
					: []),
				reason,
			],
			{
				group: groupId,
				schedule: item.schedule,
				date: item.originDate,
				action,
				targetDate: item.date,
				start: item.start,
				end: item.end,
			},
			[
				`Ocurrencia original: ${item.originDate}. Solo cambia esta fecha; las semanas siguientes se conservan.`,
				disclaimer,
			],
			"El motivo y el horario original quedan en el historial local. La ventana se recalcula en las fechas afectadas.",
		);
	}
	function windowText(date: string) {
		try {
			const window = dayWindow(s, groupId, date);
			return window
				? `${window.start}–${window.end} · fin ${window.last}`
				: "Sin ventana";
		} catch {
			return "Ventana fuera del día: revisa los minutos configurados";
		}
	}
	return (
		<section className="schedule-calendar" aria-labelledby={headingId}>
			<header className="schedule-header">
				<div>
					<h2 id={headingId}>Horario semanal</h2>
					<p>
						Fechas y horas de {s.school.timezone}. Selecciona un día para
						gestionar sus clases.
					</p>
				</div>
				<div className="schedule-controls">
					<button
						type="button"
						onClick={() =>
							open(
								"assignment",
								"Agregar materia al grupo",
								[
									field("subject", "Materia"),
									field("teacher", "Docente"),
									field("period", "Periodo"),
									field("min", "Calificación mínima", "number"),
									field("max", "Calificación máxima", "number"),
								],
								{ group: groupId, min: "0", max: "10" },
								[],
								"La asignación se conserva aunque todavía no tenga horario.",
							)
						}
					>
						Agregar materia
					</button>
					<button
						type="button"
						className="primary"
						disabled={!assignments.length}
						onClick={() => schedule()}
					>
						Agendar clase semanal
					</button>
				</div>
			</header>
			<p className="schedule-disclaimer">{disclaimer}</p>
			{!assignments.length && (
				<p>
					Empieza por agregar una materia y su docente; después podrás agendar
					su recurrencia.
				</p>
			)}
			<div className="schedule-toolbar">
				<div className="schedule-controls">
					<button
						type="button"
						disabled={monday <= "1900-01-08"}
						onClick={() => setSelectedDate(addDays(selectedDate, -7))}
					>
						Semana anterior
					</button>
					<button type="button" onClick={() => setSelectedDate(today)}>
						Hoy
					</button>
					<button
						type="button"
						disabled={monday >= "9999-12-20"}
						onClick={() => setSelectedDate(addDays(selectedDate, 7))}
					>
						Semana siguiente
					</button>
				</div>
				<label>
					Ir a fecha
					<input
						type="date"
						min="1900-01-08"
						max="9999-12-20"
						value={selectedDate}
						onChange={(e) => {
							if (
								validDate(e.target.value) &&
								e.target.value >= "1900-01-08" &&
								e.target.value <= "9999-12-20"
							)
								setSelectedDate(e.target.value);
						}}
					/>
				</label>
			</div>
			<p aria-live="polite">
				Semana del {dates[0]} al {dates[6]} · Programada / Cancelada /
				Reagendada
			</p>
			<section
				className="schedule-scroll"
				aria-label="Calendario semanal con desplazamiento horizontal y vertical"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: El calendario necesita foco para desplazamiento horizontal y vertical con teclado.
				tabIndex={0}
			>
				<div className="schedule-grid">
					<div className="schedule-corner">Hora</div>
					{days.map((day) => (
						<div className="schedule-day-heading" key={day.date}>
							<button
								type="button"
								aria-pressed={selectedDate === day.date}
								onClick={() => setSelectedDate(day.date)}
							>
								{weekday(day.date)}
								<br />
								<time dateTime={day.date}>{day.date.slice(5)}</time>
								{day.date === today ? " · Hoy" : ""}
							</button>
							<p>
								{day.holiday
									? `Inhábil: ${day.holiday.reason}`
									: windowText(day.date)}
							</p>
						</div>
					))}
					<div
						className="schedule-axis"
						style={{ height: (endHour - startHour) * 120 }}
					>
						{hours.map((hour) => (
							<span key={hour} style={{ top: (hour - startHour) * 120 }}>
								{String(hour).padStart(2, "0")}:00
							</span>
						))}
					</div>
					{days.map((day) => (
						<section
							key={day.date}
							className={`schedule-day ${day.holiday ? "schedule-day-off" : ""}`}
							style={{ height: (endHour - startHour) * 120 }}
							aria-label={`${weekday(day.date)} ${day.date}`}
						>
							{hours.map((hour) => (
								<div
									key={hour}
									className="schedule-hour-line"
									style={{ top: (hour - startHour) * 120 }}
								/>
							))}
							{day.items.map((item, index) => (
								<div
									key={`${item.schedule}-${item.status}-${item.originDate}`}
									className={`schedule-block schedule-${item.status}`}
									style={{
										top: (minutes(item.start) - startHour * 60) * 2,
										height: (minutes(item.end) - minutes(item.start)) * 2,
										left:
											item.status === "cancel" || item.status === "move"
												? "50%"
												: 4,
										right:
											item.status === "cancel" || item.status === "move"
												? 4
												: day.items.some(
															(other) =>
																other !== item &&
																(other.status === "cancel" ||
																	other.status === "move") &&
																other.start < item.end &&
																other.end > item.start,
														)
													? "50%"
													: 4,
										zIndex: index + 1,
									}}
									title={`${name(item.assignment)} · ${item.start}–${item.end} · ${statusLabels[item.status]} · ${item.reason}`}
								>
									<strong>{name(item.assignment)}</strong>
									<span>
										{item.start}–{item.end}
									</span>
									<span>{statusLabels[item.status]}</span>
								</div>
							))}
						</section>
					))}
				</div>
			</section>
			<section
				className="schedule-detail"
				aria-label="Clases del día seleccionado"
			>
				<h3>
					{weekday(selectedDate)} · {selectedDate}
				</h3>
				<p>
					{selected.holiday
						? `Día inhábil: ${selected.holiday.reason}. Sin clases efectivas ni ventana.`
						: `Ventana de fin de jornada: ${windowText(selectedDate)}`}
				</p>
				{!selected.items.length && (
					<p>
						No hay clases para esta fecha. Agenda una recurrencia o reagenda una
						clase desde otro día.
					</p>
				)}
				{selected.items.map((item) => (
					<article
						className="schedule-occurrence"
						key={`${item.schedule}-${item.status}-${item.originDate}`}
					>
						<h4>
							{name(item.assignment)} · {item.start}–{item.end}
						</h4>
						<p>
							{statusLabels[item.status]}
							{item.reason ? ` · Motivo: ${item.reason}` : ""}
							{item.status === "moved" ? ` · Desde ${item.originDate}` : ""}
						</p>
						<p>{assignments.find((a) => a.id === item.assignment)?.teacher}</p>
						<div className="schedule-controls">
							{(item.status === "active" || item.status === "moved") && (
								<>
									<button
										type="button"
										onClick={() => occurrence(item, "cancel")}
									>
										Cancelar clase
									</button>
									<button
										type="button"
										onClick={() => occurrence(item, "move")}
									>
										Reagendar clase
									</button>
								</>
							)}
							{item.status !== "active" && (
								<button
									type="button"
									onClick={() => occurrence(item, "restore")}
								>
									Restaurar ocurrencia
								</button>
							)}
						</div>
						<details>
							<summary>Horario original e historial</summary>
							<p>
								Serie: {slots.find((slot) => slot.id === item.schedule)?.day} ·{" "}
								{slots.find((slot) => slot.id === item.schedule)?.start}–
								{slots.find((slot) => slot.id === item.schedule)?.end}. Fecha
								original: {item.originDate}.
							</p>
							{s.scheduleChanges
								.filter(
									(change) =>
										change.schedule === item.schedule &&
										change.date === item.originDate,
								)
								.map((change) => (
									<p key={change.id}>
										{change.recordedAt} · {change.author} ·{" "}
										{change.action === "move"
											? `Reagendada a ${change.targetDate} ${change.start}–${change.end}`
											: change.action === "cancel"
												? "Cancelada"
												: "Restaurada"}{" "}
										· {change.reason}
									</p>
								))}
						</details>
					</article>
				))}
			</section>
			<section className="schedule-settings">
				<h3>Ventana de fin de jornada del grupo</h3>
				<p>
					{config.before} minutos antes y {config.after} después del fin de la
					última clase efectiva. No se calcula una ventana por clase. Los días
					sin clases o inhábiles no tienen ventana.
				</p>
				<button
					type="button"
					onClick={() =>
						open(
							"schedule-window",
							"Configurar ventana del grupo",
							[
								field("before", "Minutos antes (0–120, enteros)", "number"),
								field("after", "Minutos después (0–120, enteros)", "number"),
							],
							{
								group: groupId,
								before: String(config.before),
								after: String(config.after),
							},
							[disclaimer],
							"La configuración afecta solo a este grupo. Las cancelaciones y reagendas recalculan el fin de jornada.",
						)
					}
				>
					Configurar minutos
				</button>
			</section>
			<details className="schedule-series">
				<summary>Materias y recurrencias ({slots.length})</summary>
				{assignments.map((assignment) => (
					<div className="schedule-occurrence" key={assignment.id}>
						<h4>
							{assignment.subject} · {assignment.teacher}
						</h4>
						<p>
							{assignment.period} · Escala {assignment.min}–{assignment.max}
						</p>
						{slots
							.filter((slot) => slot.assignment === assignment.id)
							.map((slot) => (
								<div className="schedule-controls" key={slot.id}>
									<span>
										{slot.day} {slot.start}–{slot.end}
									</span>
									<button type="button" onClick={() => schedule(slot)}>
										Editar recurrencia de {assignment.subject}
									</button>
								</div>
							))}
					</div>
				))}
			</details>
		</section>
	);
}
