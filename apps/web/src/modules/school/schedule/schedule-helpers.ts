import { z } from "zod";
import type { State } from "../shared/workflows";

export const weekdays = [
	"Domingo",
	"Lunes",
	"Martes",
	"Miércoles",
	"Jueves",
	"Viernes",
	"Sábado",
];
export const scheduleChangesSchema = z
	.array(
		z
			.object({
				id: z.string(),
				schedule: z.string(),
				date: z.string().refine(validDate),
				action: z.enum(["cancel", "move", "restore"]),
				targetDate: z.string().refine(validDate),
				start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
				end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
				originalStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
				originalEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
				reason: z.string(),
				author: z.string(),
				recordedAt: z.string(),
			})
			.refine(
				(change) =>
					change.start < change.end &&
					change.originalStart < change.originalEnd,
			),
	)
	.default([]);
export const scheduleStaffingSchema = z
	.array(
		z.object({
			id: z.string(),
			schedule: z.string(),
			/** Original date of the occurrence; follows it when it is rescheduled. */
			date: z.string().refine(validDate),
			role: z.enum(["substitute", "teacher", "titular"]),
			teacher: z.string(),
			reason: z.string(),
			author: z.string(),
			recordedAt: z.string(),
		}),
	)
	.default([]);
export const scheduleWindowsSchema = z
	.array(
		z.object({
			group: z.string(),
			before: z.number().int().min(0).max(120),
			after: z.number().int().min(0).max(120),
		}),
	)
	.default([]);
export function validDate(value: string) {
	if (
		!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
		value < "1900-01-01" ||
		value > "9999-12-31"
	)
		return false;
	const date = new Date(`${value}T12:00:00Z`);
	return (
		Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
	);
}
export function assertDate(value: string) {
	if (!validDate(value))
		throw Error("Selecciona una fecha real entre 1900 y 9999 (AAAA-MM-DD).");
}
export const weekday = (date: string) =>
	weekdays[new Date(`${date}T12:00:00Z`).getUTCDay()];
export function addDays(date: string, days: number) {
	const next = new Date(`${date}T12:00:00Z`);
	next.setUTCDate(next.getUTCDate() + days);
	return next.toISOString().slice(0, 10);
}
export function schoolToday(timezone: string, now = new Date()) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(now);
	return ["year", "month", "day"]
		.map((type) => parts.find((p) => p.type === type)?.value)
		.join("-");
}
export const minutes = (time: string) =>
	Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const clock = (value: number) =>
	`${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
export function assertTime(start: string, end: string) {
	if (![start, end].every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)))
		throw Error("Usa horas reales con formato HH:mm.");
	if (start >= end)
		throw Error(
			"La hora final debe ser posterior a la inicial; no se permite cruzar medianoche.",
		);
}
export type Occurrence = {
	schedule: string;
	assignment: string;
	date: string;
	originDate: string;
	start: string;
	end: string;
	status: "active" | "cancel" | "move" | "moved";
	reason: string;
	/** Teacher for this date: the titular unless a per-date record overrides it. */
	teacher: string;
	coverRole: "substitute" | "teacher" | null;
};
function cover(s: State, schedule: string, date: string, titular: string) {
	const record = s.scheduleStaffing
		.filter((x) => x.schedule === schedule && x.date === date)
		.at(-1);
	return record && record.role !== "titular"
		? { teacher: record.teacher, coverRole: record.role }
		: { teacher: titular, coverRole: null };
}
export function occurrences(
	s: State,
	group: string,
	date: string,
): Occurrence[] {
	const slots = s.schedules.filter(
		(slot) =>
			s.assignments.find((a) => a.id === slot.assignment)?.group === group,
	);
	const result: Occurrence[] = [];
	for (const slot of slots) {
		const titular =
			s.assignments.find((a) => a.id === slot.assignment)?.teacher || "";
		const latest = new Map<string, State["scheduleChanges"][number]>();
		for (const change of s.scheduleChanges.filter(
			(c) => c.schedule === slot.id,
		))
			latest.set(change.date, change);
		const change = latest.get(date);
		if (slot.day === weekday(date))
			result.push({
				schedule: slot.id,
				assignment: slot.assignment,
				date,
				originDate: date,
				start: change?.originalStart || slot.start,
				end: change?.originalEnd || slot.end,
				status:
					change && change.action !== "restore" ? change.action : "active",
				reason: change?.reason || "",
				...cover(s, slot.id, date, titular),
			});
		for (const item of latest.values())
			if (item.action === "move" && item.targetDate === date)
				result.push({
					schedule: slot.id,
					assignment: slot.assignment,
					date,
					originDate: item.date,
					start: item.start,
					end: item.end,
					status: "moved",
					reason: item.reason,
					...cover(s, slot.id, item.date, titular),
				});
	}
	return result.sort((a, b) => a.start.localeCompare(b.start));
}
export const effectiveOccurrences = (s: State, group: string, date: string) =>
	s.exceptions.some((e) => e.date === date)
		? []
		: occurrences(s, group, date).filter(
				(o) => o.status === "active" || o.status === "moved",
			);
export function dayWindow(s: State, group: string, date: string) {
	const items = effectiveOccurrences(s, group, date);
	if (!items.length) return null;
	const last = items.reduce(
		(end, item) => (item.end > end ? item.end : end),
		"00:00",
	);
	const config = s.scheduleWindows.find((w) => w.group === group) || {
		before: 0,
		after: 0,
	};
	const start = minutes(last) - config.before,
		end = minutes(last) + config.after;
	if (start < 0 || end >= 1440)
		throw Error(
			"La ventana cruza medianoche. Reduce los minutos o cambia la hora de fin.",
		);
	return { last, start: clock(start), end: clock(end) };
}
function assertDay(s: State, group: string, date: string) {
	const items = effectiveOccurrences(s, group, date);
	for (let i = 0; i < items.length; i++)
		for (let j = i + 1; j < items.length; j++)
			if (items[i].start < items[j].end && items[i].end > items[j].start)
				throw Error(
					`El horario se superpone con otra clase el ${date}. Elige otra hora.`,
				);
	dayWindow(s, group, date);
}
function assertGroup(s: State, group: string) {
	const slots = s.schedules.filter(
		(slot) =>
			s.assignments.find((a) => a.id === slot.assignment)?.group === group,
	);
	for (let i = 0; i < slots.length; i++)
		for (let j = i + 1; j < slots.length; j++)
			if (
				slots[i].day === slots[j].day &&
				slots[i].start < slots[j].end &&
				slots[i].end > slots[j].start
			)
				throw Error(
					"El horario se superpone con otra clase recurrente del grupo.",
				);
	// An exception-free reference week verifies every recurring day, independently of today's date.
	const baseline = { ...s, scheduleChanges: [], exceptions: [] };
	for (let i = 0; i < 7; i++)
		dayWindow(baseline, group, addDays("2026-01-05", i));
	for (const date of new Set(
		s.scheduleChanges.flatMap((c) => [c.date, c.targetDate]),
	))
		assertDay(s, group, date);
}
export function applySchedule(
	s: State,
	kind: string,
	d: Record<string, string>,
	id: string,
) {
	if (kind === "schedule-window") {
		if (!s.groups.some((g) => g.id === d.group))
			throw Error("Selecciona un grupo existente.");
		const parse = (value: string) => {
			if (!/^\d+$/.test(value) || Number(value) > 120)
				throw Error("Indica minutos enteros entre 0 y 120.");
			return Number(value);
		};
		const config = {
			group: d.group,
			before: parse(d.before),
			after: parse(d.after),
		};
		const old = s.scheduleWindows.find((w) => w.group === d.group);
		if (old) Object.assign(old, config);
		else s.scheduleWindows.push(config);
		assertGroup(s, d.group);
		return;
	}
	if (kind === "schedule") {
		const assignment = s.assignments.find((a) => a.id === d.assignment);
		if (!assignment) throw Error("Selecciona una asignación.");
		if (d.group && assignment.group !== d.group)
			throw Error("Selecciona una asignación de este grupo.");
		if (!weekdays.includes(d.day))
			throw Error("Selecciona un día de la semana.");
		assertTime(d.start, d.end);
		const old = d.id ? s.schedules.find((slot) => slot.id === d.id) : undefined;
		if (d.id && !old) throw Error("Horario inexistente.");
		const reshaped =
			old &&
			(old.assignment !== assignment.id ||
				old.day !== d.day ||
				old.start !== d.start ||
				old.end !== d.end);
		if (reshaped && s.scheduleChanges.some((c) => c.schedule === old.id))
			throw Error(
				"Esta serie tiene historial de excepciones. Reagenda cada fecha para conservar su trazabilidad.",
			);
		const values = {
			assignment: assignment.id,
			day: d.day,
			start: d.start,
			end: d.end,
		};
		const teacher = d.teacher?.trim();
		if (teacher) assignment.teacher = teacher;
		if (old) Object.assign(old, values);
		else s.schedules.push({ id, ...values });
		assertGroup(s, assignment.group);
		return;
	}
	if (kind === "schedule-delete") {
		const index = s.schedules.findIndex((slot) => slot.id === d.id);
		if (index < 0) throw Error("Horario inexistente.");
		const owner = s.assignments.find(
			(a) => a.id === s.schedules[index].assignment,
		);
		if (d.group && owner?.group !== d.group)
			throw Error("La clase no pertenece a este grupo.");
		if (
			s.scheduleChanges.some((c) => c.schedule === d.id) ||
			s.scheduleStaffing.some((c) => c.schedule === d.id)
		)
			throw Error(
				"Esta serie tiene historial de cancelaciones, reagendas o suplencias; no se puede eliminar.",
			);
		s.schedules.splice(index, 1);
		return;
	}
	const slot = s.schedules.find((slot) => slot.id === d.schedule);
	if (!slot) throw Error("Selecciona una clase existente.");
	const assignment = s.assignments.find((a) => a.id === slot.assignment);
	if (!assignment)
		throw Error(
			"La asignación de esta clase no existe. Revisa las materias del grupo antes de modificar el horario.",
		);
	if (d.group && d.group !== assignment.group)
		throw Error("La clase no pertenece a este grupo.");
	assertDate(d.date);
	if (weekday(d.date) !== slot.day)
		throw Error("La fecha no corresponde al día de esta clase.");
	if (kind === "schedule-staffing") {
		if (!["substitute", "teacher", "titular"].includes(d.role))
			throw Error("Selecciona suplente, cambio de docente o docente titular.");
		const teacher = d.role === "titular" ? "" : d.teacher?.trim() || "";
		if (d.role !== "titular" && !teacher)
			throw Error("Indica el docente para esta fecha.");
		if (teacher === assignment.teacher)
			throw Error("Elige un docente distinto al titular.");
		if (!d.reason?.trim()) throw Error("Escribe el motivo del cambio.");
		s.scheduleStaffing.push({
			id,
			schedule: slot.id,
			date: d.date,
			role: d.role as "substitute" | "teacher" | "titular",
			teacher,
			reason: d.reason.trim(),
			author: "Personal demo",
			recordedAt: new Date().toISOString(),
		});
		return;
	}
	if (!d.reason?.trim()) throw Error("Escribe el motivo del cambio.");
	if (!["cancel", "move", "restore"].includes(d.action))
		throw Error("Selecciona cancelar, reagendar o restaurar.");
	const previous = s.scheduleChanges.find(
		(c) => c.schedule === slot.id && c.date === d.date,
	);
	const targetDate = d.action === "move" ? d.targetDate : d.date;
	const start =
		d.action === "move" ? d.start : previous?.originalStart || slot.start;
	const end = d.action === "move" ? d.end : previous?.originalEnd || slot.end;
	assertDate(targetDate);
	assertTime(start, end);
	if (d.action === "move" && s.exceptions.some((e) => e.date === targetDate))
		throw Error("La fecha destino es inhábil. Selecciona otro día.");
	s.scheduleChanges.push({
		id,
		schedule: slot.id,
		date: d.date,
		action: d.action as "cancel" | "move" | "restore",
		targetDate,
		start,
		end,
		originalStart: previous?.originalStart || slot.start,
		originalEnd: previous?.originalEnd || slot.end,
		reason: d.reason.trim(),
		author: "Personal demo",
		recordedAt: new Date().toISOString(),
	});
	// Include every previously used destination when replacing an exception.
	for (const date of new Set(
		s.scheduleChanges
			.filter((c) => c.schedule === slot.id)
			.flatMap((c) => [c.date, c.targetDate]),
	))
		assertDay(s, assignment.group, date);
}
/**
 * Inverse of a per-date change, computed before applying it. Undo never deletes
 * history: it records a new change that re-applies the previous state of that date.
 */
export function undoCommand(
	s: State,
	kind: "schedule-occurrence" | "schedule-staffing",
	d: Record<string, string>,
): { kind: string; data: Record<string, string> } {
	const base = {
		group: d.group,
		schedule: d.schedule,
		date: d.date,
		reason: `Deshacer: ${d.reason?.trim() || "cambio"}`,
	};
	if (kind === "schedule-staffing") {
		const previous = s.scheduleStaffing
			.filter((x) => x.schedule === d.schedule && x.date === d.date)
			.at(-1);
		return {
			kind,
			data:
				previous && previous.role !== "titular"
					? { ...base, role: previous.role, teacher: previous.teacher }
					: { ...base, role: "titular", teacher: "" },
		};
	}
	const previous = s.scheduleChanges
		.filter((x) => x.schedule === d.schedule && x.date === d.date)
		.at(-1);
	if (!previous || previous.action === "restore")
		return { kind, data: { ...base, action: "restore" } };
	return {
		kind,
		data: {
			...base,
			action: previous.action,
			...(previous.action === "move"
				? {
						targetDate: previous.targetDate,
						start: previous.start,
						end: previous.end,
					}
				: {}),
		},
	};
}
