import { useCallback, useState } from "react";
import {
	ClassMenu,
	type GridColumn,
	type GridItem,
	type MenuAction,
	ScheduleGrid,
} from "./schedule-grid";
import {
	addDays,
	clock,
	dayWindow,
	minutes,
	type Occurrence,
	occurrences,
	schoolToday,
	validDate,
	weekday,
	weekdays,
} from "./schedule-helpers";
import { field, options, reason } from "./view-helpers";
import type { ViewProps } from "./view-types";
import type { State } from "./workflows";
import "./schedule-calendar.css";

const disclaimer =
	"Solo simulación local; no se comunica a terminales ni autoriza entrega de menores";
const schoolWeek = [...weekdays.slice(1), weekdays[0]];
const displayDate = (date: string, full = false) =>
	new Intl.DateTimeFormat("es-MX", {
		day: "numeric",
		month: "short",
		...(full ? { year: "numeric" as const } : {}),
		timeZone: "UTC",
	}).format(new Date(`${date}T12:00:00Z`));
const occurrenceKey = (item: Occurrence) =>
	JSON.stringify([item.schedule, item.originDate, item.status]);
const statusLabels = {
	active: "Programada",
	cancel: "Cancelada",
	move: "Reagendada · origen",
	moved: "Reagendada · destino",
};
const coverLabels = { substitute: "Suplente", teacher: "Cubre" };
const coverRoles = [
	{ id: "substitute", name: "Asignar suplente" },
	{ id: "teacher", name: "Asignar otro docente" },
	{ id: "titular", name: "Volver al docente titular" },
];
type Slot = State["schedules"][number];
type Menu =
	| { kind: "occurrence"; item: Occurrence; key: string; anchor: HTMLElement }
	| { kind: "slot"; slot: Slot; key: string; anchor: HTMLElement };

export function ScheduleCalendar({
	s,
	groupId,
	open,
	initialView = "dates",
}: {
	s: State;
	groupId: string;
	open: ViewProps["open"];
	initialView?: "dates" | "structure";
}) {
	const [view, setView] = useState(initialView);
	const [menu, setMenu] = useState<Menu | null>(null);
	const closeMenu = useCallback(() => setMenu(null), []);
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
	const name = (id: string) =>
		assignments.find((a) => a.id === id)?.subject || "Materia";
	const titular = (id: string) =>
		assignments.find((a) => a.id === id)?.teacher || "";
	const tone = (id: string) =>
		Math.max(
			assignments.findIndex((a) => a.id === id),
			0,
		) % 5;
	const teachers = [
		...new Set([
			...s.staff.filter((x) => x.role === "Docente").map((x) => x.name),
			...s.assignments.map((a) => a.teacher),
		]),
	]
		.filter(Boolean)
		.sort((a, b) => a.localeCompare(b, "es"))
		.map((teacher) => ({ id: teacher, name: teacher }));

	function schedule(slot?: Slot, draft: Partial<Slot> = {}) {
		const moving = Boolean(slot && (draft.day || draft.start));
		const values = { ...slot, ...draft };
		const subject = slot ? name(slot.assignment) : "";
		open(
			"schedule",
			moving
				? `Mover ${subject} a ${values.day} ${values.start}`
				: slot
					? `Editar clase semanal · ${subject}`
					: draft.day
						? `Agendar clase · ${draft.day} ${draft.start}`
						: "Agendar clase semanal",
			[
				options(
					"assignment",
					"Materia",
					assignments.map((a) => ({
						id: a.id,
						name: `${a.subject} · ${a.teacher} · ${a.period}`,
					})),
				),
				...(slot
					? [
							{
								...options(
									"teacher",
									"Nuevo docente titular (opcional)",
									teachers,
								),
								optional: true,
							},
						]
					: []),
				options(
					"day",
					"Día de la semana",
					schoolWeek.map((day) => ({ id: day, name: day })),
				),
				field("start", "Inicio", "time"),
				field("end", "Fin", "time"),
			],
			{
				group: groupId,
				assignment: values.assignment || assignments[0]?.id || "",
				day: values.day || "Lunes",
				start: values.start || "08:00",
				end: values.end || "09:00",
				...(slot ? { id: slot.id } : {}),
			},
			[
				"Se repite cada semana. No se permiten cruces de medianoche ni clases superpuestas.",
				...(slot
					? [
							"El docente titular cambia para la materia en todas sus clases. Para una sola fecha, usa Editar en la vista Por fechas.",
						]
					: []),
			],
			"Una serie con cancelaciones o reagendas registradas conserva su día y hora: cambia cada fecha desde la vista Por fechas.",
		);
	}
	function removeSlot(slot: Slot) {
		const subject = name(slot.assignment);
		open(
			"schedule-delete",
			`Eliminar clase semanal · ${subject} · ${slot.day} ${slot.start}`,
			[],
			{ group: groupId, id: slot.id },
			[
				`${subject} deja de repetirse los ${slot.day.toLowerCase()} de ${slot.start} a ${slot.end}.`,
				"La materia y sus calificaciones se conservan.",
			],
			"Una serie con cancelaciones, reagendas o suplencias registradas no se puede eliminar, para conservar su historial.",
		);
	}
	function occurrence(
		item: Occurrence,
		action: "cancel" | "move" | "restore",
		target?: { date: string; start: string },
	) {
		const subject = name(item.assignment);
		const end = target
			? clock(minutes(target.start) + minutes(item.end) - minutes(item.start))
			: item.end;
		const title =
			action === "cancel"
				? `Cancelar clase · ${subject} · ${item.originDate}`
				: action === "restore"
					? `Restaurar clase · ${subject} · ${item.originDate}`
					: target
						? `Reagendar ${subject} al ${displayDate(target.date)} ${target.start}`
						: `Reagendar clase · ${subject} · ${item.originDate}`;
		open(
			"schedule-occurrence",
			title,
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
				targetDate: target?.date || item.date,
				start: target?.start || item.start,
				end,
			},
			[
				`Fecha original: ${displayDate(item.originDate, true)}. Solo cambia esta fecha; las demás semanas se conservan.`,
				disclaimer,
			],
			"El motivo y el horario original quedan en el historial local. El fin de jornada se recalcula en las fechas afectadas.",
		);
	}
	function staffing(item: Occurrence) {
		const subject = name(item.assignment);
		open(
			"schedule-staffing",
			`Editar clase · ${subject} · ${item.originDate}`,
			[
				options("role", "Cambio", coverRoles),
				{
					...options("teacher", "Docente para esta fecha", teachers),
					optional: true,
				},
				reason,
			],
			{
				group: groupId,
				schedule: item.schedule,
				date: item.originDate,
				role: item.coverRole || "substitute",
				teacher: item.coverRole ? item.teacher : "",
			},
			[
				`Solo cambia la clase del ${displayDate(item.date, true)}. ${titular(item.assignment)} sigue como titular en las demás semanas.`,
			],
			"Para volver al titular elige «Volver al docente titular»; el docente indicado se ignora.",
		);
	}
	function windowText(date: string) {
		try {
			const window = dayWindow(s, groupId, date);
			if (!window) return "Sin clases efectivas";
			return window.start === window.end
				? `Fin de jornada: ${window.last}`
				: `Ventana: ${window.start}–${window.end} · fin ${window.last}`;
		} catch {
			return "Ventana fuera del día: revisa los minutos configurados";
		}
	}

	const byKey = new Map<string, Occurrence>();
	const dayItems = dates.map((date) => occurrences(s, groupId, date));
	const dated: { columns: GridColumn[]; items: GridItem[] } = {
		columns: dates.map((date) => {
			const holiday = s.exceptions.find((e) => e.date === date);
			return {
				key: date,
				date,
				label: weekday(date),
				day: date.slice(8),
				today: date === today,
				note: holiday ? "Día inhábil" : windowText(date),
				noteTitle: holiday?.reason,
				off: Boolean(holiday),
			};
		}),
		items: dayItems.flatMap((items) =>
			items.map((item) => {
				const key = occurrenceKey(item);
				byKey.set(key, item);
				const ghost = item.status === "cancel" || item.status === "move";
				const shared = items.some(
					(other) =>
						other !== item &&
						(other.status === "cancel" || other.status === "move") &&
						other.start < item.end &&
						other.end > item.start,
				);
				const cover = item.coverRole
					? `${coverLabels[item.coverRole]}: ${item.teacher}`
					: "";
				return {
					key,
					column: item.date,
					start: item.start,
					end: item.end,
					title: name(item.assignment),
					detail: ghost || !cover ? statusLabels[item.status] : cover,
					covered: !ghost && Boolean(cover),
					status: item.status,
					tone: tone(item.assignment),
					draggable: !ghost,
					side: ghost ? "right" : shared ? "left" : "full",
					label: `${name(item.assignment)} · ${displayDate(item.date, true)} · ${item.start}–${item.end} · ${statusLabels[item.status]}${cover ? ` · ${cover}` : ""}. Abrir opciones`,
					hint: `${name(item.assignment)} · ${item.start}–${item.end} · ${item.teacher}${ghost ? "" : " · Arrastra para reagendar"}`,
				} satisfies GridItem;
			}),
		),
	};
	const structure: { columns: GridColumn[]; items: GridItem[] } = {
		columns: schoolWeek.map((day) => {
			const daySlots = slots.filter((slot) => slot.day === day);
			const last = daySlots.reduce(
				(end, slot) => (slot.end > end ? slot.end : end),
				"",
			);
			return {
				key: day,
				label: day,
				note: daySlots.length
					? `${daySlots.length} ${daySlots.length === 1 ? "clase" : "clases"} · fin ${last}`
					: "Sin clases",
			};
		}),
		items: slots.map((slot) => ({
			key: slot.id,
			column: slot.day,
			start: slot.start,
			end: slot.end,
			title: name(slot.assignment),
			detail: titular(slot.assignment),
			status: "active",
			tone: tone(slot.assignment),
			draggable: true,
			side: "full",
			label: `${name(slot.assignment)} · cada ${slot.day} · ${slot.start}–${slot.end} · ${titular(slot.assignment)}. Abrir opciones`,
			hint: `${name(slot.assignment)} · ${slot.start}–${slot.end} · Arrastra para cambiar día u hora`,
		})),
	};

	const menuContent = (() => {
		if (!menu) return null;
		if (menu.kind === "slot") {
			const { slot } = menu;
			return {
				title: name(slot.assignment),
				lines: [
					`Cada ${slot.day.toLowerCase()} · ${slot.start}–${slot.end}`,
					`Titular: ${titular(slot.assignment) || "Sin docente"}`,
				],
				actions: [
					{ label: "Editar", run: () => schedule(slot) },
					{ label: "Eliminar", run: () => removeSlot(slot), tone: "danger" },
				] satisfies MenuAction[],
			};
		}
		const { item } = menu;
		const live = item.status === "active" || item.status === "moved";
		return {
			title: name(item.assignment),
			lines: [
				`${weekday(item.date)} ${displayDate(item.date, true)} · ${item.start}–${item.end}`,
				item.coverRole
					? `${coverLabels[item.coverRole]}: ${item.teacher} (titular: ${titular(item.assignment)})`
					: `Docente: ${item.teacher || "Sin docente"}`,
				`${statusLabels[item.status]}${item.reason ? ` · ${item.reason}` : ""}${item.status === "moved" ? ` · desde ${displayDate(item.originDate)}` : ""}`,
			],
			actions: [
				...(live
					? [
							{ label: "Editar", run: () => staffing(item) },
							{ label: "Reagendar", run: () => occurrence(item, "move") },
							{
								label: "Cancelar clase",
								run: () => occurrence(item, "cancel"),
								tone: "danger" as const,
							},
						]
					: []),
				...(item.status !== "active"
					? [{ label: "Restaurar", run: () => occurrence(item, "restore") }]
					: []),
			] satisfies MenuAction[],
		};
	})();
	const grid = view === "dates" ? dated : structure;

	return (
		<section
			className="schedule-calendar"
			aria-labelledby="schedule-calendar-heading"
		>
			<header className="schedule-header">
				<div>
					<h2 id="schedule-calendar-heading">Horario semanal</h2>
					<p>
						{view === "dates"
							? "Arrastra una clase para reagendarla. Haz clic en ella para editarla o cancelarla solo en esa fecha."
							: "Define las clases que se repiten cada semana. Arrastra para cambiar día u hora, o haz clic en un hueco para agregar una clase."}
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
			<div className="schedule-toolbar" data-view={view}>
				<fieldset className="schedule-views">
					<legend className="schedule-hidden">Vista del horario</legend>
					{(
						[
							["dates", "Por fechas"],
							["structure", "Estructura semanal"],
						] as const
					).map(([id, text]) => (
						<button
							type="button"
							key={id}
							aria-pressed={view === id}
							onClick={() => {
								setMenu(null);
								setView(id);
							}}
						>
							{text}
						</button>
					))}
				</fieldset>
				{view === "dates" ? (
					<>
						<div className="schedule-week" aria-live="polite">
							<h3>
								{displayDate(dates[0])} – {displayDate(dates[6], true)}
							</h3>
							<p>Hora local · {s.school.timezone}</p>
						</div>
						<fieldset className="schedule-controls schedule-nav">
							<legend className="schedule-hidden">Navegar semanas</legend>
							<button
								type="button"
								aria-label="Semana anterior"
								disabled={monday <= "1900-01-08"}
								onClick={() => setSelectedDate(addDays(selectedDate, -7))}
							>
								Anterior
							</button>
							<button type="button" onClick={() => setSelectedDate(today)}>
								Hoy
							</button>
							<button
								type="button"
								aria-label="Semana siguiente"
								disabled={monday >= "9999-12-20"}
								onClick={() => setSelectedDate(addDays(selectedDate, 7))}
							>
								Siguiente
							</button>
						</fieldset>
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
					</>
				) : (
					<div className="schedule-week">
						<h3>Plantilla de cada semana</h3>
						<p>
							{slots.length} {slots.length === 1 ? "clase" : "clases"} ·
							Cancelaciones y reagendas se hacen en Por fechas
						</p>
					</div>
				)}
			</div>
			<div className="schedule-legend">
				<span className="schedule-hidden">Estados de las clases:</span>
				{view === "dates" ? (
					<>
						<span data-status="active">Programada</span>
						<span data-status="cancel">Cancelada</span>
						<span data-status="move">Reagendada</span>
						<span data-status="cover">Suplencia</span>
					</>
				) : (
					<span data-status="active">Clase semanal</span>
				)}
				<p className="schedule-scroll-hint">
					Desliza horizontalmente para ver toda la semana.
				</p>
			</div>
			<ScheduleGrid
				key={view}
				columns={grid.columns}
				items={grid.items}
				activeKey={menu?.key}
				label={
					view === "dates"
						? "Calendario semanal por fechas con desplazamiento horizontal y vertical"
						: "Estructura semanal con desplazamiento horizontal y vertical"
				}
				onSelect={(item, anchor) => {
					if (menu?.key === item.key) return setMenu(null);
					if (view === "structure") {
						const slot = slots.find((x) => x.id === item.key);
						if (slot) setMenu({ kind: "slot", slot, key: item.key, anchor });
						return;
					}
					const found = byKey.get(item.key);
					if (found)
						setMenu({ kind: "occurrence", item: found, key: item.key, anchor });
				}}
				onMove={(item, column, start) => {
					setMenu(null);
					if (view === "structure") {
						const slot = slots.find((x) => x.id === item.key);
						if (slot)
							schedule(slot, {
								day: column,
								start,
								end: clock(
									minutes(start) + minutes(slot.end) - minutes(slot.start),
								),
							});
						return;
					}
					const found = byKey.get(item.key);
					if (found) occurrence(found, "move", { date: column, start });
				}}
				onCreate={
					view === "structure" && assignments.length
						? (day, start) =>
								schedule(undefined, {
									day,
									start,
									end: clock(Math.min(minutes(start) + 60, 23 * 60 + 59)),
								})
						: undefined
				}
			/>
			{menu && menuContent && (
				<ClassMenu
					anchor={menu.anchor}
					title={menuContent.title}
					actions={menuContent.actions}
					onClose={closeMenu}
				>
					{menuContent.lines.map((line) => (
						<p key={line}>{line}</p>
					))}
				</ClassMenu>
			)}
		</section>
	);
}
