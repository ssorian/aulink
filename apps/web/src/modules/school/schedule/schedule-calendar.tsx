import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardTitle } from "../../../components/ui/card";
import { Icon } from "../../../components/ui/icon";
import { field, options } from "../shared/view-helpers";
import type { ViewProps } from "../shared/view-types";
import type { State } from "../shared/workflows";
import { ClassPanel } from "./class-panel";
import { coverWords, hash, hm, longDate, shortDate } from "./schedule-format";
import { type GridColumn, type GridItem, ScheduleGrid } from "./schedule-grid";
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
import { dayMarks } from "./schedule-marks";
import { SchedulePanelBody } from "./schedule-panel-body";
import {
	type ChangeRow,
	MiniMonth,
	SubjectFilter,
	WeekChanges,
} from "./schedule-sidebar";
import { ScheduleToast } from "./schedule-toast";
import { subjectTones } from "./schedule-tones";
import { ScheduleToolbar, type ScheduleView } from "./schedule-toolbar";
import type { PanelMode, PanelState, Slot, ToastState } from "./schedule-types";

export { subjectTones };

const disclaimer =
	"Solo simulación local; no se comunica a terminales ni autoriza entrega de menores";
const schoolWeek = [...weekdays.slice(1), weekdays[0]];
const occurrenceKey = (item: Occurrence) =>
	JSON.stringify([item.schedule, item.originDate, item.status]);

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
	initialView?: ScheduleView;
}) {
	const [view, setView] = useState(initialView);
	const [panel, setPanel] = useState<PanelState | null>(null);
	const [error, setError] = useState("");
	const [toast, setToast] = useState<ToastState | null>(null);
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
	const marks = dayMarks(s, slots);
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
	function setMode(mode: PanelMode) {
		setError("");
		setPanel((current) =>
			current?.kind === "occurrence" ? { ...current, mode } : current,
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
			data-slot="schedule-calendar"
			className="mt-6 min-w-0 text-foreground tabular-nums max-[760px]:mt-4 [&_:focus-visible]:outline-3 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-primary"
			aria-labelledby="schedule-calendar-heading"
		>
			<div className="grid items-start gap-5 min-[1241px]:grid-cols-[248px_minmax(0,1fr)]">
				<div data-slot="schedule-main" className="min-w-0 min-[1241px]:order-2">
					<ScheduleToolbar
						view={view}
						dates={dates}
						monday={monday}
						today={today}
						timezone={s.school.timezone}
						canCreate={assignments.length > 0}
						onStep={(days) => {
							closePanel();
							setSelectedDate(addDays(selectedDate, days));
						}}
						onToday={() => setSelectedDate(today)}
						onView={(next) => {
							closePanel();
							setView(next);
						}}
						onCreate={() => schedule()}
					/>
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
								<Card
									padding="none"
									className="absolute inset-x-6 top-24 z-50 mx-auto max-w-[420px] rounded-2xl p-6 text-center shadow-[0_12px_32px_-12px_rgb(31_45_54/0.25)]"
								>
									<CardTitle className="mb-1.5 text-lg">
										Este grupo aún no tiene materias
									</CardTitle>
									<p className="mb-4 text-sm text-muted-foreground">
										Agrega una materia con su docente; después podrás acomodar
										sus clases en la semana.
									</p>
									<Button
										variant="primary"
										className="px-[18px]"
										onClick={addSubject}
									>
										<Icon name="plus" size={18} />
										Agregar materia
									</Button>
								</Card>
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
				<aside
					data-slot="schedule-aside"
					aria-label="Filtros del horario"
					className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-4 max-[1240px]:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] min-[1241px]:order-1"
				>
					{view === "dates" && (
						<MiniMonth
							className="[&_header_button]:size-8 [&_header_button]:min-h-8"
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
					<p className="m-0 px-1 text-xs leading-normal text-muted-foreground max-[1240px]:col-span-full">
						{disclaimer}
					</p>
				</aside>
			</div>
			{panel && (
				<ClassPanel
					key={`${panel.key}-${panel.kind === "occurrence" ? panel.mode : "slot"}`}
					anchor={panel.anchor}
					title={panelTitle}
					onClose={closePanel}
				>
					<SchedulePanelBody
						panel={panel}
						teachers={teachers}
						titular={titular}
						error={error}
						onMode={setMode}
						onSubmit={submitPanel}
						onEditSlot={() => panel.kind === "slot" && schedule(panel.slot)}
						onRemoveSlot={() => panel.kind === "slot" && removeSlot(panel.slot)}
					/>
				</ClassPanel>
			)}
			{toast && (
				<ScheduleToast
					toast={toast}
					onUndo={undoLast}
					onClose={() => setToast(null)}
				/>
			)}
			<p className="sr-only" aria-live="polite">
				{announce}
			</p>
		</section>
	);
}
