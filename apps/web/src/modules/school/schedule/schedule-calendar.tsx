import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Icon } from "../../../components/ui/icon";
import {
	ClassPanel,
	type GridColumn,
	type GridItem,
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
	undoCommand,
	weekday,
	weekdays,
} from "./schedule-helpers";
import {
	type ChangeRow,
	type DayMarks,
	MiniMonth,
	SubjectFilter,
	WeekChanges,
} from "./schedule-sidebar";
import { field, options } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import type { State } from "../shared/workflows";
import "./schedule-calendar.css";

const disclaimer =
	"Solo simulación local; no se comunica a terminales ni autoriza entrega de menores";
const schoolWeek = [...weekdays.slice(1), weekdays[0]];
const fmt = (date: string, options: Intl.DateTimeFormatOptions) =>
	new Intl.DateTimeFormat("es-MX", { ...options, timeZone: "UTC" }).format(
		new Date(`${date}T12:00:00Z`),
	);
/** "lun 2 nov" */
const shortDate = (date: string) =>
	fmt(date, { weekday: "short", day: "numeric", month: "short" }).replace(
		/\./g,
		"",
	);
const longDate = (date: string) =>
	fmt(date, { weekday: "long", day: "numeric", month: "long" });
function weekTitle(first: string, last: string) {
	const sameMonth = first.slice(0, 7) === last.slice(0, 7);
	const start = fmt(
		first,
		sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" },
	);
	return `${start} – ${fmt(last, { day: "numeric", month: "short", year: "numeric" })}`.replace(
		/\./g,
		"",
	);
}
function isoWeek(date: string) {
	const d = new Date(`${date}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
	const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
	return (
		1 +
		Math.round(
			((d.getTime() - firstThursday.getTime()) / 86400000 -
				3 +
				((firstThursday.getUTCDay() + 6) % 7)) /
				7,
		)
	);
}
function zoneName(timezone: string) {
	try {
		const name = new Intl.DateTimeFormat("es-MX", {
			timeZone: timezone,
			timeZoneName: "longGeneric",
		})
			.formatToParts(new Date())
			.find((part) => part.type === "timeZoneName")?.value;
		return name ? name.charAt(0).toUpperCase() + name.slice(1) : timezone;
	} catch {
		return timezone;
	}
}
function hash(value: string) {
	let h = 0;
	for (const char of value) h = (h * 31 + char.charCodeAt(0)) | 0;
	return Math.abs(h);
}
/**
 * One colour per subject across the school, in order of first creation, so a
 * subject keeps its colour in every group and new subjects never repaint old ones.
 */
export function subjectTones(s: State) {
	const order: string[] = [];
	for (const a of s.assignments) {
		const subject = a.subject.trim().toLowerCase();
		if (!order.includes(subject)) order.push(subject);
	}
	return (subject: string) =>
		Math.max(order.indexOf(subject.trim().toLowerCase()), 0) % 8;
}
/** "07:30" → "7:30" */
const hm = (time: string) => time.replace(/^0(\d)/, "$1");
const occurrenceKey = (item: Occurrence) =>
	JSON.stringify([item.schedule, item.originDate, item.status]);
const coverWords = { substitute: "Suplente", teacher: "Cubre" };
type Slot = State["schedules"][number];
type Mode = "view" | "cancel" | "move" | "staff" | "restore";
type Panel =
	| {
			kind: "occurrence";
			item: Occurrence;
			key: string;
			anchor: HTMLElement;
			mode: Mode;
			draft?: { date: string; start: string; end: string };
	  }
	| { kind: "slot"; slot: Slot; key: string; anchor: HTMLElement };
type Toast = {
	text: string;
	undo?: { kind: string; data: Record<string, string> };
};

export function ScheduleCalendar({
	s,
	groupId,
	open,
	run,
	initialView = "dates",
}: {
	s: State;
	groupId: string;
	open: ViewProps["open"];
	run?: (kind: string, data: Record<string, string>) => void;
	initialView?: "dates" | "structure";
}) {
	const [view, setView] = useState(initialView);
	const [panel, setPanel] = useState<Panel | null>(null);
	const [error, setError] = useState("");
	const [toast, setToast] = useState<Toast | null>(null);
	const [announce, setAnnounce] = useState("");
	const [hidden, setHidden] = useState(new Set<string>());
	const closePanel = useCallback(() => {
		setPanel(null);
		setError("");
	}, []);
	const today = schoolToday(s.school.timezone);
	const [selectedDate, setSelectedDate] = useState(today);
	const [now, setNow] = useState<{ date: string; minutes: number } | null>(
		null,
	);
	useEffect(() => {
		const tick = () => {
			const parts = new Intl.DateTimeFormat("en-GB", {
				timeZone: s.school.timezone,
				hour: "2-digit",
				minute: "2-digit",
				hourCycle: "h23",
			}).formatToParts(new Date());
			const part = (type: string) =>
				Number(parts.find((p) => p.type === type)?.value || 0);
			setNow({
				date: schoolToday(s.school.timezone),
				minutes: part("hour") * 60 + part("minute"),
			});
		};
		tick();
		const timer = setInterval(tick, 60_000);
		return () => clearInterval(timer);
	}, [s.school.timezone]);
	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(() => setToast(null), 10_000);
		return () => clearTimeout(timer);
	}, [toast]);

	const monday = addDays(
		selectedDate,
		-((new Date(`${selectedDate}T12:00:00Z`).getUTCDay() + 6) % 7),
	);
	const dates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
	const assignments = s.assignments.filter((a) => a.group === groupId);
	const slots = s.schedules.filter((slot) =>
		assignments.some((a) => a.id === slot.assignment),
	);
	const assignment = (id: string) => assignments.find((a) => a.id === id);
	const name = (id: string) => assignment(id)?.subject || "Materia";
	const titular = (id: string) => assignment(id)?.teacher || "";
	const subjectTone = subjectTones(s);
	const tone = (id: string) => subjectTone(name(id));
	const visible = (id: string) => !hidden.has(name(id));
	const domId = (key: string) => `schedule-${groupId}-${hash(key)}`;
	const teachers = [
		...new Set([
			...s.staff.filter((x) => x.role === "Docente").map((x) => x.name),
			...s.assignments.map((a) => a.teacher),
		]),
	]
		.filter(Boolean)
		.sort((a, b) => a.localeCompare(b, "es"));
	const latestChange = (schedule: string, date: string) =>
		s.scheduleChanges
			.filter((c) => c.schedule === schedule && c.date === date)
			.at(-1);

	function addSubject() {
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
			"La materia se conserva aunque todavía no tenga horario.",
		);
	}
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
									teachers.map((t) => ({ id: t, name: t })),
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
							"El docente titular cambia para la materia en todas sus clases. Para una sola fecha, usa la vista Por fechas.",
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
	/** Per-date changes apply at once and offer an undo that adds, never deletes, history. */
	function commitChange(
		kind: "schedule-occurrence" | "schedule-staffing",
		data: Record<string, string>,
		done: string,
	) {
		if (!run) {
			open(kind, done, [], data, [disclaimer]);
			closePanel();
			return;
		}
		const undo = undoCommand(s, kind, data);
		try {
			run(kind, data);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Revisa los datos.");
			return;
		}
		const anchor = panel?.anchor;
		closePanel();
		setToast({ text: done, undo });
		setAnnounce(done);
		requestAnimationFrame(() => {
			if (anchor?.isConnected) anchor.focus();
		});
	}
	function undoLast() {
		if (!toast?.undo || !run) return;
		try {
			run(toast.undo.kind, toast.undo.data);
			setToast({ text: "Cambio deshecho. Quedó registrado en el historial." });
			setAnnounce("Cambio deshecho");
		} catch (e) {
			setToast({
				text: `No se pudo deshacer: ${e instanceof Error ? e.message : "revisa el horario"}`,
			});
		}
	}

	// Dated view data
	const byKey = new Map<string, Occurrence>();
	const dayItems = dates.map((date) => occurrences(s, groupId, date));
	const isPast = (item: Occurrence) =>
		item.date < today ||
		(now !== null &&
			item.date === now.date &&
			minutes(item.end) <= now.minutes);
	const datedColumns: GridColumn[] = dates.map((date) => {
		const holiday = s.exceptions.find((e) => e.date === date);
		let end: GridColumn["end"];
		try {
			const window = holiday ? null : dayWindow(s, groupId, date);
			if (window)
				end = {
					at: window.last,
					subtle: window.start === window.end,
					...(window.start !== window.end
						? { band: { start: window.start, end: window.end } }
						: {}),
				};
		} catch {
			end = undefined;
		}
		return {
			key: date,
			date,
			label: weekday(date),
			short: weekday(date).slice(0, 3).toUpperCase(),
			weekend: ["Sábado", "Domingo"].includes(weekday(date)),
			day: String(Number(date.slice(8))),
			today: date === today,
			holiday: holiday?.reason,
			end,
		};
	});
	const datedItems: GridItem[] = dayItems.flatMap((items) =>
		items
			.filter((item) => visible(item.assignment))
			.map((item) => {
				const key = occurrenceKey(item);
				byKey.set(key, item);
				const ghost =
					item.status === "cancel" || item.status === "move"
						? item.status
						: undefined;
				const overlaps = (ghosts: boolean) =>
					items.some(
						(other) =>
							other !== item &&
							(other.status === "cancel" || other.status === "move") ===
								ghosts &&
							visible(other.assignment) &&
							other.start < item.end &&
							other.end > item.start,
					);
				const target =
					item.status === "move"
						? latestChange(item.schedule, item.originDate)
						: undefined;
				const badge: GridItem["badge"] =
					item.status === "cancel"
						? { tone: "cancel", text: "Cancelada" }
						: item.status === "move"
							? {
									tone: "move",
									text: target
										? `Movida al ${shortDate(target.targetDate)}`
										: "Reagendada",
								}
							: item.coverRole
								? {
										tone: "cover",
										text: `${coverWords[item.coverRole]}: ${item.teacher}`,
									}
								: item.status === "moved"
									? {
											tone: "moved",
											text: `Desde ${shortDate(item.originDate)}`,
										}
									: undefined;
				return {
					key,
					id: domId(key),
					column: item.date,
					start: item.start,
					end: item.end,
					title: name(item.assignment),
					time: `${hm(item.start)}–${hm(item.end)}`,
					tone: tone(item.assignment),
					ghost,
					badge,
					past: isPast(item),
					draggable: !ghost,
					side: ghost
						? overlaps(false)
							? "right"
							: "full"
						: overlaps(true)
							? "left"
							: "full",
					label: `${name(item.assignment)}, ${longDate(item.date)}, ${item.start} a ${item.end}${badge ? `, ${badge.text}` : ""}. Abrir opciones`,
				} satisfies GridItem;
			}),
	);
	const marks: DayMarks = new Map();
	const mark = (date: string, value: "cancel" | "move" | "cover") => {
		if (!marks.has(date)) marks.set(date, new Set());
		marks.get(date)?.add(value);
	};
	for (const slot of slots) {
		const seen = new Map<string, State["scheduleChanges"][number]>();
		for (const change of s.scheduleChanges.filter(
			(c) => c.schedule === slot.id,
		))
			seen.set(change.date, change);
		for (const change of seen.values()) {
			if (change.action === "cancel") mark(change.date, "cancel");
			if (change.action === "move") {
				mark(change.date, "move");
				mark(change.targetDate, "move");
			}
		}
		const covers = new Map<string, State["scheduleStaffing"][number]>();
		for (const record of s.scheduleStaffing.filter(
			(c) => c.schedule === slot.id,
		))
			covers.set(record.date, record);
		for (const record of covers.values())
			if (record.role !== "titular") {
				const moved = seen.get(record.date);
				mark(
					moved?.action === "move" ? moved.targetDate : record.date,
					"cover",
				);
			}
	}
	function openFromList(key: string) {
		const item = byKey.get(key);
		if (!item) return;
		const element = document.getElementById(domId(key));
		if (!element) return;
		element.scrollIntoView({ block: "center", inline: "center" });
		element.focus();
		setError("");
		setPanel({ kind: "occurrence", item, key, anchor: element, mode: "view" });
	}
	const changeRows: ChangeRow[] = dayItems
		.flat()
		.filter((item) => visible(item.assignment))
		.flatMap((item): ChangeRow[] => {
			const key = occurrenceKey(item);
			const subject = name(item.assignment);
			const base = { key, subject, onOpen: () => openFromList(key) };
			if (item.status === "cancel")
				return [
					{
						...base,
						mark: "cancel",
						text: `${shortDate(item.date)} · Cancelada${item.reason ? ` · ${item.reason}` : ""}`,
					},
				];
			if (item.status === "moved")
				return [
					{
						...base,
						mark: "move",
						text: `Reagendada al ${shortDate(item.date)}, ${item.start}${item.coverRole ? ` · ${coverWords[item.coverRole]}: ${item.teacher}` : ""}`,
					},
				];
			if (item.status === "move") {
				const target = latestChange(item.schedule, item.originDate);
				if (target && dates.includes(target.targetDate)) return [];
				return [
					{
						...base,
						mark: "move",
						text: `${shortDate(item.date)} · Movida al ${target ? shortDate(target.targetDate) : "otra semana"}`,
					},
				];
			}
			if (item.coverRole)
				return [
					{
						...base,
						mark: "cover",
						text: `${shortDate(item.date)} · ${coverWords[item.coverRole]}: ${item.teacher}`,
					},
				];
			return [];
		});

	// Weekly structure data
	const structureColumns: GridColumn[] = schoolWeek.map((day) => {
		const count = slots.filter((slot) => slot.day === day).length;
		return {
			key: day,
			label: day,
			short: day.slice(0, 3).toUpperCase(),
			weekend: day === "Sábado" || day === "Domingo",
			summary: count
				? `${count} ${count === 1 ? "clase" : "clases"}`
				: "Sin clases",
			add: assignments.length
				? () => schedule(undefined, { day, start: "08:00", end: "09:00" })
				: undefined,
		};
	});
	const structureItems: GridItem[] = slots
		.filter((slot) => visible(slot.assignment))
		.map((slot) => ({
			key: slot.id,
			id: domId(slot.id),
			column: slot.day,
			start: slot.start,
			end: slot.end,
			title: name(slot.assignment),
			time: `${hm(slot.start)}–${hm(slot.end)}`,
			badge: undefined,
			tone: tone(slot.assignment),
			draggable: true,
			side: "full",
			label: `${name(slot.assignment)}, cada ${slot.day}, ${slot.start} a ${slot.end}, titular ${titular(slot.assignment) || "sin docente"}. Abrir opciones`,
		}));
	const subjectRows = [...new Set(assignments.map((a) => a.subject))].map(
		(subject) => {
			const ids = assignments
				.filter((a) => a.subject === subject)
				.map((a) => a.id);
			const own = slots.filter((slot) => ids.includes(slot.assignment));
			return {
				id: subject,
				subject,
				teacher: titular(own[0]?.assignment || ids[0]),
				tone: subjectTone(subject),
				minutes: own.reduce(
					(sum, slot) => sum + minutes(slot.end) - minutes(slot.start),
					0,
				),
			};
		},
	);
	function submitPanel(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (panel?.kind !== "occurrence") return;
		const form = new FormData(e.currentTarget);
		const value = (key: string) => String(form.get(key) || "").trim();
		const { item } = panel;
		const subject = name(item.assignment);
		const base = {
			group: groupId,
			schedule: item.schedule,
			date: item.originDate,
			reason: value("reason"),
		};
		if (!base.reason) {
			setError("Escribe el motivo del cambio.");
			return;
		}
		if (panel.mode === "staff") {
			const role = value("role");
			commitChange(
				"schedule-staffing",
				{ ...base, role, teacher: role === "titular" ? "" : value("teacher") },
				role === "titular"
					? `${subject} del ${shortDate(item.date)} vuelve con ${titular(item.assignment)}.`
					: `${value("teacher")} cubre ${subject} el ${shortDate(item.date)}.`,
			);
			return;
		}
		if (panel.mode === "move") {
			commitChange(
				"schedule-occurrence",
				{
					...base,
					action: "move",
					targetDate: value("targetDate"),
					start: value("start"),
					end: value("end"),
				},
				`${subject} reagendada al ${shortDate(value("targetDate"))}, ${value("start")}.`,
			);
			return;
		}
		commitChange(
			"schedule-occurrence",
			{ ...base, action: panel.mode === "cancel" ? "cancel" : "restore" },
			panel.mode === "cancel"
				? `${subject} del ${shortDate(item.date)} cancelada.`
				: `${subject} del ${shortDate(item.originDate)} restaurada.`,
		);
	}
	function setMode(mode: Mode) {
		setError("");
		setPanel((current) =>
			current?.kind === "occurrence" ? { ...current, mode } : current,
		);
	}
	function panelBody() {
		if (!panel) return null;
		if (panel.kind === "slot") {
			const { slot } = panel;
			return (
				<div className="schedule-panel-body">
					<p className="schedule-panel-meta">
						Cada {slot.day.toLowerCase()} · {slot.start}–{slot.end}
					</p>
					<p>Titular: {titular(slot.assignment) || "Sin docente"}</p>
					<div className="schedule-panel-actions">
						<button type="button" data-autofocus onClick={() => schedule(slot)}>
							Editar
						</button>
						<button
							type="button"
							data-tone="danger"
							onClick={() => removeSlot(slot)}
						>
							Eliminar
						</button>
					</div>
				</div>
			);
		}
		const { item, mode, draft } = panel;
		const live = item.status === "active" || item.status === "moved";
		const errorLine = error && (
			<p className="schedule-panel-error" role="alert">
				{error}
			</p>
		);
		const reasonField = (placeholder: string) => (
			<label>
				Motivo
				<textarea
					name="reason"
					rows={2}
					required
					placeholder={placeholder}
					data-autofocus={
						mode === "cancel" || mode === "restore" ? true : undefined
					}
				/>
			</label>
		);
		const footer = (primary: string, danger = false) => (
			<div className="schedule-panel-actions">
				<button type="button" onClick={() => setMode("view")}>
					Volver
				</button>
				<button type="submit" className={danger ? "danger" : "primary"}>
					{primary}
				</button>
			</div>
		);
		if (mode === "view")
			return (
				<div className="schedule-panel-body">
					<p className="schedule-panel-meta">
						{longDate(item.date)} · {item.start}–{item.end}
					</p>
					{item.coverRole ? (
						<p>
							<strong>
								{coverWords[item.coverRole]}: {item.teacher}
							</strong>
							<br />
							Titular: {titular(item.assignment)}
						</p>
					) : (
						<p>Docente: {item.teacher || "Sin docente"}</p>
					)}
					{item.status !== "active" && (
						<p className="schedule-panel-status" data-status={item.status}>
							{item.status === "cancel"
								? "Cancelada"
								: item.status === "move"
									? "Reagendada a otra fecha"
									: `Reagendada desde el ${shortDate(item.originDate)}`}
							{item.reason ? ` · ${item.reason}` : ""}
						</p>
					)}
					<div className="schedule-panel-actions">
						{live && (
							<>
								<button
									type="button"
									data-autofocus
									onClick={() => setMode("staff")}
								>
									Cambiar docente
								</button>
								<button type="button" onClick={() => setMode("move")}>
									Reagendar
								</button>
								<button
									type="button"
									data-tone="danger"
									onClick={() => setMode("cancel")}
								>
									Cancelar clase
								</button>
							</>
						)}
						{item.status !== "active" && (
							<button type="button" onClick={() => setMode("restore")}>
								Restaurar
							</button>
						)}
					</div>
				</div>
			);
		if (mode === "staff")
			return (
				<form className="schedule-panel-body" onSubmit={submitPanel} noValidate>
					<p className="schedule-panel-meta">
						Solo el {longDate(item.date)}. Titular: {titular(item.assignment)}.
					</p>
					<fieldset className="schedule-choice">
						<legend>Cambio</legend>
						{(
							[
								["substitute", "Suplente"],
								["teacher", "Otro docente"],
								["titular", "Volver al titular"],
							] as const
						).map(([value, text]) => (
							<label key={value}>
								<input
									type="radio"
									name="role"
									value={value}
									defaultChecked={(item.coverRole || "substitute") === value}
									disabled={value === "titular" && !item.coverRole}
								/>
								{text}
							</label>
						))}
					</fieldset>
					<label>
						Docente para esta fecha
						<select
							name="teacher"
							defaultValue={item.coverRole ? item.teacher : ""}
							data-autofocus
						>
							<option value="">Selecciona…</option>
							{teachers
								.filter((t) => t !== titular(item.assignment))
								.map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
						</select>
					</label>
					{reasonField("Ej. licencia médica del titular")}
					{errorLine}
					{footer("Guardar")}
				</form>
			);
		if (mode === "move")
			return (
				<form className="schedule-panel-body" onSubmit={submitPanel} noValidate>
					<p className="schedule-panel-meta">
						Solo cambia la clase del {longDate(item.originDate)}.
					</p>
					<div className="schedule-panel-row">
						<label>
							Fecha
							<input
								type="date"
								name="targetDate"
								defaultValue={draft?.date || item.date}
								data-autofocus={draft ? undefined : true}
							/>
						</label>
					</div>
					<div className="schedule-panel-row">
						<label>
							Inicio
							<input
								type="time"
								name="start"
								defaultValue={draft?.start || item.start}
							/>
						</label>
						<label>
							Fin
							<input
								type="time"
								name="end"
								defaultValue={draft?.end || item.end}
							/>
						</label>
					</div>
					<label>
						Motivo
						<textarea
							name="reason"
							rows={2}
							required
							placeholder="Ej. junta de academia"
							data-autofocus={draft ? true : undefined}
						/>
					</label>
					{errorLine}
					{footer("Reagendar")}
				</form>
			);
		return (
			<form className="schedule-panel-body" onSubmit={submitPanel} noValidate>
				<p className="schedule-panel-meta">
					{mode === "cancel"
						? `Se cancela solo el ${longDate(item.date)}. Queda visible como evidencia.`
						: `Vuelve a su horario original del ${longDate(item.originDate)}.`}
				</p>
				{reasonField(
					mode === "cancel"
						? "Ej. suspensión por junta"
						: "Ej. se resolvió el aviso",
				)}
				{errorLine}
				{footer(
					mode === "cancel" ? "Cancelar clase" : "Restaurar",
					mode === "cancel",
				)}
			</form>
		);
	}

	const columns = view === "dates" ? datedColumns : structureColumns;
	const items = view === "dates" ? datedItems : structureItems;
	const panelTitle = panel
		? name(
				panel.kind === "slot" ? panel.slot.assignment : panel.item.assignment,
			)
		: "";
	return (
		<section
			className="schedule-calendar"
			aria-labelledby="schedule-calendar-heading"
		>
			<div className="schedule-layout">
				<div className="schedule-main">
					<header className="schedule-head">
						<div className="schedule-head-title">
							{view === "dates" && (
								<div className="schedule-step">
									<button
										type="button"
										className="schedule-icon-button schedule-prev"
										aria-label="Semana anterior"
										onClick={() => {
											closePanel();
											setSelectedDate(addDays(selectedDate, -7));
										}}
									>
										<Icon name="chevron" />
									</button>
									<button
										type="button"
										className="schedule-icon-button"
										aria-label="Semana siguiente"
										onClick={() => {
											closePanel();
											setSelectedDate(addDays(selectedDate, 7));
										}}
									>
										<Icon name="chevron" />
									</button>
								</div>
							)}
							<div>
								<h2 id="schedule-calendar-heading" aria-live="polite">
									{view === "dates"
										? weekTitle(dates[0], dates[6])
										: "Estructura semanal"}
								</h2>
								<p className="schedule-zone">
									{view === "dates"
										? `Semana ${isoWeek(monday)} · ${zoneName(s.school.timezone)}`
										: "Plantilla que se repite cada semana"}
								</p>
							</div>
						</div>
						<div className="schedule-head-actions">
							{view === "dates" && !dates.includes(today) && (
								<button
									type="button"
									className="schedule-today"
									onClick={() => setSelectedDate(today)}
								>
									Ir a hoy
								</button>
							)}
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
											closePanel();
											setView(id);
										}}
									>
										{text}
									</button>
								))}
							</fieldset>
							<button
								type="button"
								className={`schedule-create ${view === "structure" ? "primary" : ""}`}
								disabled={!assignments.length}
								onClick={() => schedule()}
							>
								<Icon name="plus" size={18} />
								Agendar clase
							</button>
						</div>
					</header>
					<ScheduleGrid
						key={view}
						columns={columns}
						items={items}
						activeKey={panel?.key}
						now={
							view === "dates" && now && dates.includes(now.date)
								? { column: now.date, minutes: now.minutes }
								: undefined
						}
						label={
							view === "dates"
								? "Calendario de la semana. Flechas para moverte entre clases; Enter abre sus opciones."
								: "Estructura semanal. Flechas para moverte entre clases; Enter abre sus opciones."
						}
						empty={
							!assignments.length ? (
								<div className="schedule-empty">
									<h3>Este grupo aún no tiene materias</h3>
									<p>
										Agrega una materia con su docente; después podrás acomodar
										sus clases en la semana.
									</p>
									<button
										type="button"
										className="primary"
										onClick={addSubject}
									>
										<Icon name="plus" size={18} />
										Agregar materia
									</button>
								</div>
							) : undefined
						}
						onSelect={(item, anchor) => {
							if (panel?.key === item.key) return closePanel();
							setError("");
							if (view === "structure") {
								const slot = slots.find((x) => x.id === item.key);
								if (slot)
									setPanel({ kind: "slot", slot, key: item.key, anchor });
								return;
							}
							const found = byKey.get(item.key);
							if (found)
								setPanel({
									kind: "occurrence",
									item: found,
									key: item.key,
									anchor,
									mode: "view",
								});
						}}
						onMove={(item, column, start) => {
							setError("");
							if (view === "structure") {
								closePanel();
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
							const anchor = document.getElementById(item.id);
							if (found && anchor)
								setPanel({
									kind: "occurrence",
									item: found,
									key: item.key,
									anchor,
									mode: "move",
									draft: {
										date: column,
										start,
										end: clock(
											minutes(start) +
												minutes(found.end) -
												minutes(found.start),
										),
									},
								});
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
				</div>
				<aside className="schedule-aside" aria-label="Filtros del horario">
					{view === "dates" && (
						<MiniMonth
							selected={selectedDate}
							today={today}
							marks={marks}
							onSelect={(date) => {
								closePanel();
								setSelectedDate(date);
							}}
						/>
					)}
					{view === "dates" && <WeekChanges rows={changeRows} />}
					<SubjectFilter
						rows={subjectRows}
						hidden={hidden}
						onAdd={addSubject}
						onToggle={(id) => {
							const next = new Set(hidden);
							if (next.has(id)) next.delete(id);
							else next.add(id);
							setHidden(next);
						}}
					/>
					<p className="schedule-disclaimer">{disclaimer}</p>
				</aside>
			</div>
			{panel && (
				<ClassPanel
					key={`${panel.key}-${panel.kind === "occurrence" ? panel.mode : "slot"}`}
					anchor={panel.anchor}
					title={panelTitle}
					onClose={closePanel}
				>
					{panelBody()}
				</ClassPanel>
			)}
			{toast && (
				<div className="schedule-toast">
					<p>{toast.text}</p>
					{toast.undo && (
						<button type="button" onClick={undoLast}>
							Deshacer
						</button>
					)}
					<button
						type="button"
						className="schedule-icon-button"
						aria-label="Cerrar aviso"
						onClick={() => setToast(null)}
					>
						<Icon name="close" size={16} />
					</button>
				</div>
			)}
			<p className="schedule-hidden" aria-live="polite">
				{announce}
			</p>
		</section>
	);
}
