import { useCallback, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Field } from "../../../components/ui/field";
import { Icon } from "../../../components/ui/icon";
import { Legend } from "../../../components/ui/legend";
import { type Tone, toneFill } from "../../../components/ui/tone";
import { cn } from "../../../lib/utils";
import {
	CalendarDayActions,
	type DayAnchor,
} from "../schedule/calendar-day-actions";
import { schoolToday } from "../schedule/schedule-helpers";
import { field } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import { cycleDateFields } from "./cycle-dates";

const iso = (date: Date) => date.toISOString().slice(0, 10);
const asDate = (date: string) => new Date(`${date}T12:00:00Z`);
const formatDate = (date: string, options: Intl.DateTimeFormatOptions) =>
	asDate(date).toLocaleDateString("es-MX", { ...options, timeZone: "UTC" });

const controlClass =
	"min-h-11 min-w-0 max-w-full flex-1 border-0 bg-transparent py-0 pl-0 text-sm font-semibold text-foreground outline-none focus-visible:outline-none";
const dayMarkers: Record<string, { tone: Tone; ink: string }> = {
	off: { tone: "brick", ink: "text-brick-ink" },
	holiday: { tone: "brown", ink: "text-brown-ink" },
	event: { tone: "teal", ink: "text-teal-ink" },
};
const legend: { tone: Tone; label: string }[] = [
	{ tone: "brick", label: "Sin clases" },
	{ tone: "brown", label: "Feriado · solo visual" },
	{ tone: "teal", label: "Evento" },
];

function DayMarker({
	kind,
	label,
}: {
	kind: keyof typeof dayMarkers;
	label: string;
}) {
	const marker = dayMarkers[kind];
	return (
		<span
			data-slot="cycle-day-marker"
			data-tone={marker.tone}
			className={cn("flex items-center gap-1.5 text-xs", marker.ink)}
		>
			<span
				aria-hidden="true"
				className={cn("size-1.5 shrink-0 rounded-full", toneFill[marker.tone])}
			/>
			<span className="max-sm:sr-only">{label}</span>
		</span>
	);
}

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
		<div data-slot="cycle-calendar" className="min-w-0 tabular-nums">
			<Card aria-label="Configuración del ciclo" className="mb-5 @container">
				<div
					data-slot="cycle-settings-row"
					className="grid grid-cols-1 items-center gap-x-6 gap-y-4 @xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] @4xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)_auto]"
				>
					<Field id="cycle-select" label="Ciclo escolar">
						<select
							id="cycle-select"
							className={controlClass}
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
					</Field>
					<dl
						data-slot="cycle-dates"
						className="m-0 grid min-w-0 grid-cols-2 gap-4"
					>
						{(
							[
								["Inicio", cycle?.startDate],
								["Cierre", cycle?.endDate],
							] as const
						).map(([label, date]) => (
							<div key={label} className="grid min-w-0 gap-0.5">
								<dt className="text-xs font-medium text-muted-foreground">
									{label}
								</dt>
								<dd className="m-0 text-sm text-foreground [overflow-wrap:anywhere]">
									{date ? (
										<time dateTime={date}>
											{formatDate(date, { dateStyle: "long" })}
										</time>
									) : (
										"Sin definir"
									)}
								</dd>
							</div>
						))}
					</dl>
					<div
						data-slot="cycle-settings-actions"
						className="flex flex-wrap gap-2 @xl:col-span-full @4xl:col-span-1"
					>
						<Button
							className="whitespace-nowrap"
							onClick={() =>
								open("cycle", "Crear ciclo", [
									field("name", "Nombre del ciclo"),
									...cycleDateFields(),
								])
							}
						>
							<Icon name="plus" size={18} />
							Crear ciclo
						</Button>
						{cycle && (
							<Button
								className="whitespace-nowrap"
								onClick={() =>
									open(
										"cycle-dates",
										cycle.startDate ? "Editar fechas" : "Definir fechas",
										cycleDateFields(),
										{
											id: cycle.id,
											startDate: cycle.startDate ?? "",
											endDate: cycle.endDate ?? "",
										},
										undefined,
										`Fechas del ciclo ${cycle.name}. No cambian la asistencia ni los eventos.`,
									)
								}
							>
								{cycle.startDate ? "Editar fechas" : "Definir fechas"}
							</Button>
						)}
					</div>
				</div>
				<p
					data-slot="cycle-settings-caption"
					className="m-0 mt-3 text-[13px] leading-normal text-muted-foreground"
				>
					{cycle
						? `${groups} ${groups === 1 ? "grupo" : "grupos"} en este ciclo. Alumnos y materias se administran en Grupos.`
						: "Crea un ciclo para organizar tus grupos."}
				</p>
			</Card>

			<section
				data-slot="cycle-month"
				aria-label="Calendario global"
				className="min-w-0"
			>
				<header
					data-slot="cycle-month-header"
					className="flex flex-wrap items-center justify-between gap-3"
				>
					<div className="flex flex-wrap items-center gap-3">
						<h2
							aria-live="polite"
							className="m-0 text-lg font-semibold tracking-tight first-letter:uppercase max-sm:text-base"
						>
							{formatDate(`${month}-01`, { month: "long", year: "numeric" })}
						</h2>
						<div className="flex items-center gap-2">
							<Button
								variant="icon"
								aria-label="Mes anterior"
								disabled={month === "0001-01"}
								onClick={() => showMonth(moveMonth(month, -1))}
							>
								<span className="flex rotate-180">
									<Icon name="chevron" size={18} />
								</span>
							</Button>
							<Button
								variant="icon"
								aria-label="Mes siguiente"
								disabled={month === "9998-12"}
								onClick={() => showMonth(moveMonth(month, 1))}
							>
								<Icon name="chevron" size={18} />
							</Button>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2 max-sm:w-full">
						<Button
							onClick={() => {
								setMonth(today.slice(0, 7));
								setSelected(today);
							}}
						>
							Hoy
						</Button>
						<Field
							id="cycle-month-picker"
							label="Ir al mes"
							className="max-sm:min-w-0"
						>
							<input
								id="cycle-month-picker"
								type="month"
								className={controlClass}
								value={month}
								min="0001-01"
								max="9998-12"
								onChange={(event) => showMonth(event.target.value)}
							/>
						</Field>
					</div>
				</header>
				<p className="m-0 mt-1.5 mb-3 text-[13px] text-muted-foreground">
					Todos los ciclos comparten los días sin clase.
				</p>
				<Card
					padding="none"
					data-slot="cycle-grid"
					className="min-w-0 overflow-hidden"
				>
					<div
						data-slot="cycle-weekdays"
						aria-hidden="true"
						className="grid grid-cols-7 bg-muted"
					>
						{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
							<span
								key={day}
								className="py-2.5 text-center text-xs font-semibold text-muted-foreground sm:p-3 sm:text-left"
							>
								{day}
							</span>
						))}
					</div>
					<div
						data-slot="cycle-days"
						className="grid grid-cols-7 border-t border-border"
					>
						{calendarDays(month).map((date) => {
							const holidays = s.calendarHolidays.filter(
								(item) => item.date === date,
							);
							const events = s.calendarEvents.filter(
								(item) => item.date === date,
							);
							const exceptions = s.exceptions.filter(
								(item) => item.date === date,
							);
							return (
								<button
									type="button"
									key={date}
									id={`calendar-day-${date}`}
									data-slot="cycle-day"
									data-state={
										exceptions.length
											? "off"
											: date.startsWith(month)
												? "inside"
												: "outside"
									}
									className="group relative flex min-h-16 min-w-0 cursor-pointer flex-col items-center gap-1 rounded-none border-0 border-r border-b border-border bg-card p-1 text-sm font-medium text-foreground hover:bg-muted focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-pressed:bg-teal-bg aria-pressed:outline-2 aria-pressed:-outline-offset-2 aria-pressed:outline-primary data-[state=off]:bg-brick-bg data-[state=outside]:bg-background data-[state=outside]:text-muted-foreground nth-[7n]:border-r-0 nth-last-[-n+7]:border-b-0 sm:min-h-24 sm:items-start sm:gap-2 sm:p-2.5"
									aria-label={`${formatDate(date, { dateStyle: "full" })}${exceptions.length ? ` · Sin clase: ${exceptions.map((item) => item.reason).join("; ")}` : ""}${holidays.length ? ` · Feriado (solo visual): ${holidays.map((x) => x.title).join("; ")}` : ""}${events.length ? ` · Evento: ${events.map((x) => x.title).join("; ")}` : ""}`}
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
									<span className="grid size-7 shrink-0 place-items-center rounded-full group-aria-[current=date]:bg-primary group-aria-[current=date]:text-primary-foreground">
										{Number(date.slice(-2))}
									</span>
									{exceptions.length > 0 && (
										<DayMarker kind="off" label="Sin clase" />
									)}
									{holidays.length > 0 && (
										<DayMarker kind="holiday" label="Feriado" />
									)}
									{events.length > 0 && (
										<DayMarker kind="event" label="Evento" />
									)}
								</button>
							);
						})}
					</div>
				</Card>
				<Legend
					label="Leyenda del calendario"
					items={legend}
					className="mt-3.5 mb-5"
				/>
				<CalendarDayActions
					selection={selection}
					s={s}
					open={open}
					onClose={closeActions}
				/>
			</section>
		</div>
	);
}
