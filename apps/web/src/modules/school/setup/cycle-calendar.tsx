import { useCallback, useState } from "react";
import { Icon } from "../../../components/ui/icon";
import {
	CalendarDayActions,
	type DayAnchor,
} from "../schedule/calendar-day-actions";
import { cycleDateFields } from "./cycle-dates";
import { schoolToday } from "../schedule/schedule-helpers";
import { field } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import "./cycle-calendar.css";

const iso = (date: Date) => date.toISOString().slice(0, 10);
const asDate = (date: string) => new Date(`${date}T12:00:00Z`);
const formatDate = (date: string, options: Intl.DateTimeFormatOptions) =>
	asDate(date).toLocaleDateString("es-MX", { ...options, timeZone: "UTC" });

export function moveMonth(month: string, offset: number) {
	const date = asDate(`${month}-01`);
	date.setUTCMonth(date.getUTCMonth() + offset);
	return iso(date).slice(0, 7);
}

export function calendarDays(month: string) {
	const start = asDate(`${month}-01`);
	const offset = (start.getUTCDay() + 6) % 7;
	const end = asDate(`${moveMonth(month, 1)}-01`);
	end.setUTCDate(0);
	const count = Math.ceil((offset + end.getUTCDate()) / 7) * 7;
	start.setUTCDate(1 - offset);
	return Array.from({ length: count }, (_, index) => {
		const date = new Date(start);
		date.setUTCDate(date.getUTCDate() + index);
		return iso(date);
	});
}

export function CycleCalendar({ s, open }: Pick<ViewProps, "s" | "open">) {
	const today = schoolToday(s.school.timezone);
	const [month, setMonth] = useState(today.slice(0, 7));
	const [selected, setSelected] = useState(today);
	const [cycleId, setCycleId] = useState(s.cycles[0]?.id ?? "");
	const cycle = s.cycles.find((item) => item.id === cycleId) ?? s.cycles[0];
	const groups = s.groups.filter((group) => group.cycle === cycle?.id).length;
	const [selection, setSelection] = useState<DayAnchor | null>(null);
	const closeActions = useCallback(() => setSelection(null), []);
	function showMonth(next: string) {
		if (!/^\d{4}-\d{2}$/.test(next) || next.startsWith("0000")) return;
		setMonth(next);
		setSelected(next === today.slice(0, 7) ? today : `${next}-01`);
	}

	return (
		<div className="cycle-calendar">
			<section
				className="cycle-settings"
				aria-label="Configuración del ciclo"
			>
				<div className="cycle-settings-row">
					<label className="cycle-selector">
						Ciclo escolar
						<select
							aria-label="Ciclo escolar"
							value={cycle?.id ?? ""}
							disabled={!s.cycles.length}
							onChange={(event) => setCycleId(event.target.value)}
						>
							{!s.cycles.length && (
								<option value="">Sin ciclos registrados</option>
							)}
							{s.cycles.map((item) => (
								<option key={item.id} value={item.id}>
									{item.name}
								</option>
							))}
						</select>
					</label>
					<dl className="cycle-date-metadata">
						<div><dt>Inicio</dt><dd>{cycle?.startDate ? <time dateTime={cycle.startDate}>{formatDate(cycle.startDate, { dateStyle: "long" })}</time> : "Sin definir"}</dd></div>
						<div><dt>Cierre</dt><dd>{cycle?.endDate ? <time dateTime={cycle.endDate}>{formatDate(cycle.endDate, { dateStyle: "long" })}</time> : "Sin definir"}</dd></div>
					</dl>
					<div className="cycle-settings-actions">
						<button
							type="button"
							onClick={() =>
								open("cycle", "Crear ciclo", [field("name", "Nombre del ciclo"), ...cycleDateFields()])
							}
						>
							<Icon name="plus" size={18} />
							Crear ciclo
						</button>
						{cycle && <button type="button" onClick={() => open(
							"cycle-dates", cycle.startDate ? "Editar fechas" : "Definir fechas", cycleDateFields(),
							{ id: cycle.id, startDate: cycle.startDate ?? "", endDate: cycle.endDate ?? "" },
							undefined, `Fechas del ciclo ${cycle.name}. No cambian la asistencia ni los eventos.`,
						)}>{cycle.startDate ? "Editar fechas" : "Definir fechas"}</button>}
					</div>
				</div>
				<p className="cycle-settings-caption">
					{cycle
						? `${groups} ${groups === 1 ? "grupo" : "grupos"} en este ciclo. Alumnos y materias se administran en Grupos.`
						: "Crea un ciclo para organizar tus grupos."}
				</p>
			</section>

			<section className="cycle-month" aria-label="Calendario global">
				<header className="cycle-month-header">
					<div className="cycle-month-navigation">
						<h2 aria-live="polite">
							{formatDate(`${month}-01`, { month: "long", year: "numeric" })}
						</h2>
						<div className="cycle-actions">
							<button
								type="button"
								aria-label="Mes anterior"
								disabled={month === "0001-01"}
								onClick={() => showMonth(moveMonth(month, -1))}
							>
								<span className="cycle-previous">
									<Icon name="chevron" size={18} />
								</span>
							</button>
							<button
								type="button"
								aria-label="Mes siguiente"
								disabled={month === "9998-12"}
								onClick={() => showMonth(moveMonth(month, 1))}
							>
								<Icon name="chevron" size={18} />
							</button>
						</div>
					</div>
					<div className="cycle-month-controls">
						<button
							type="button"
							onClick={() => {
								setMonth(today.slice(0, 7));
								setSelected(today);
							}}
						>
							Hoy
						</button>
						<label className="cycle-month-picker">
							Ir al mes
							<input
								type="month"
								value={month}
								min="0001-01"
								max="9998-12"
								onChange={(event) => showMonth(event.target.value)}
							/>
						</label>
					</div>
				</header>
				<p className="cycle-month-scope">
					Todos los ciclos comparten los días sin clase.
				</p>
				<div className="cycle-grid-card">
					<div className="cycle-weekdays" aria-hidden="true">
						{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
							<span key={day}>{day}</span>
						))}
					</div>
					<div className="cycle-days">
						{calendarDays(month).map((date) => {
							const holidays = s.calendarHolidays.filter((item) => item.date === date);
							const events = s.calendarEvents.filter((item) => item.date === date);
							const exceptions = s.exceptions.filter(
								(item) => item.date === date,
							);
							return (
								<button
									type="button"
									key={date}
									id={`calendar-day-${date}`}
									className={`cycle-day${date.startsWith(month) ? "" : " cycle-day-outside"}${exceptions.length ? " cycle-day-off" : ""}`}
									aria-label={`${formatDate(date, { dateStyle: "full" })}${exceptions.length ? ` · Sin clase: ${exceptions.map((item) => item.reason).join("; ")}` : ""}${holidays.length ? ` · Feriado (solo visual): ${holidays.map(x=>x.title).join("; ")}` : ""}${events.length ? ` · Evento: ${events.map(x=>x.title).join("; ")}` : ""}`}
									aria-haspopup="dialog"
									aria-controls="calendar-day-actions"
									aria-expanded={selection?.date === date}
									aria-current={date === today ? "date" : undefined}
									aria-pressed={date === selected}
									onClick={(event) => {
										setSelection({ date, button: event.currentTarget });
										setSelected(date);
										setMonth(date.slice(0, 7));
									}}
								>
									<span className="cycle-day-number">
										{Number(date.slice(-2))}
									</span>
									{exceptions.length > 0 && (
										<span className="cycle-day-event">
											<span className="cycle-event-dot" />
											<span>Sin clase</span>
										</span>
									)}
									{holidays.length > 0 && (
										<span className="cycle-day-event cycle-day-holiday">
											<span className="cycle-event-dot" /><span>Feriado</span>
										</span>
									)}
									{events.length > 0 && (
										<span className="cycle-day-event cycle-day-notice">
											<span className="cycle-event-dot" /><span>Evento</span>
										</span>
									)}
								</button>
							);
						})}
					</div>
				</div>
				<div className="cycle-calendar-legend">
					<span><i className="cycle-event-dot" />Sin clases</span>
					<span className="cycle-day-holiday"><i className="cycle-event-dot" />Feriado · solo visual</span>
					<span className="cycle-day-notice"><i className="cycle-event-dot" />Evento</span>
				</div>
				<CalendarDayActions selection={selection} s={s} open={open} onClose={closeActions} />
			</section>
		</div>
	);
}
