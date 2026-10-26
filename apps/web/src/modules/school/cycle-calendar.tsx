import { useState } from "react";
import { Icon } from "../../components/ui/icon";
import { schoolToday } from "./schedule-helpers";
import { field, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
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
	const events = s.exceptions
		.filter((item) => item.date.startsWith(month))
		.sort((a, b) => a.date.localeCompare(b.date));
	const selectedEvents = s.exceptions.filter((item) => item.date === selected);
	const addDay = () =>
		open(
			"exception",
			"Agregar día sin clase",
			[field("date", "Fecha", "date"), reason],
			{ date: selected },
		);
	function showMonth(next: string) {
		if (!/^\d{4}-\d{2}$/.test(next) || next.startsWith("0000")) return;
		setMonth(next);
		setSelected(next === today.slice(0, 7) ? today : `${next}-01`);
	}

	return (
		<div className="cycle-calendar">
			<section
				className="panel cycle-settings"
				aria-label="Configuración del ciclo"
			>
				<div className="cycle-context">
					<label>
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
					<p>
						{cycle
							? `${groups} ${groups === 1 ? "grupo" : "grupos"} en este ciclo. Alumnos y materias se administran en Grupos.`
							: "Crea un ciclo para organizar tus grupos."}
					</p>
				</div>
				<div className="cycle-actions">
					<button
						type="button"
						onClick={() =>
							open("cycle", "Crear ciclo", [field("name", "Nombre del ciclo")])
						}
					>
						<Icon name="plus" size={18} />
						Crear ciclo
					</button>
					<button type="button" className="primary" onClick={addDay}>
						<Icon name="calendar" size={18} />
						Agregar día sin clase
					</button>
				</div>
			</section>

			<section className="panel cycle-month" aria-label="Calendario global">
				<header className="cycle-month-header">
					<div>
						<h2>Calendario global</h2>
						<p>Todos los ciclos comparten los días sin clase.</p>
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
				<div className="cycle-month-navigation">
					<h3 aria-live="polite">
						{formatDate(`${month}-01`, { month: "long", year: "numeric" })}
					</h3>
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
				<div className="cycle-weekdays" aria-hidden="true">
					{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
						<span key={day}>{day}</span>
					))}
				</div>
				<div className="cycle-days">
					{calendarDays(month).map((date) => {
						const exceptions = s.exceptions.filter(
							(item) => item.date === date,
						);
						return (
							<button
								type="button"
								key={date}
								className={`cycle-day${date.startsWith(month) ? "" : " cycle-day-outside"}${exceptions.length ? " cycle-day-off" : ""}`}
								aria-label={`${formatDate(date, { dateStyle: "full" })}${exceptions.length ? ` · Sin clase: ${exceptions.map((item) => item.reason).join("; ")}` : ""}`}
								aria-current={date === today ? "date" : undefined}
								aria-pressed={date === selected}
								onClick={() => {
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
							</button>
						);
					})}
				</div>
				<div className="cycle-calendar-legend">
					<span>
						<i className="cycle-event-dot" />
						Día sin clase
					</span>
					<span>Selecciona una fecha para ver sus detalles.</span>
				</div>
				<div className="cycle-day-detail" aria-live="polite">
					<div>
						<h3>
							{formatDate(selected, {
								weekday: "long",
								day: "numeric",
								month: "long",
							})}
						</h3>
						{selectedEvents.length ? (
							selectedEvents.map((item) => <p key={item.id}>{item.reason}</p>)
						) : (
							<p>No hay días sin clase registrados para esta fecha.</p>
						)}
					</div>
					<button type="button" onClick={addDay}>
						Agregar día sin clase
					</button>
				</div>
				<details className="cycle-month-events">
					<summary>Días sin clase del mes ({events.length})</summary>
					{events.length ? (
						events.map((item) => (
							<button
								type="button"
								key={item.id}
								onClick={() => setSelected(item.date)}
							>
								<strong>
									{formatDate(item.date, { day: "numeric", month: "short" })}
								</strong>
								<span>{item.reason}</span>
							</button>
						))
					) : (
						<p>No hay días sin clase registrados en este mes.</p>
					)}
				</details>
				<p className="cycle-calendar-note">
					Los días sin clase aplican a toda la escuela. No se generan faltas
					automáticas.
				</p>
			</section>
		</div>
	);
}
