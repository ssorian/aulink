import { z } from "zod";
import { assertDate, validDate } from "./schedule-helpers";
import type { State } from "./workflows";

const calendarRecord = z.object({
	id: z.string().min(1),
	date: z.string().refine(validDate),
	title: z.string().trim().min(1),
});
export const calendarHolidaysSchema = z.array(calendarRecord).default([]);
export const calendarEventsSchema = z
	.array(calendarRecord.extend({ noticeId: z.string().min(1) }))
	.default([]);

/** Mutates only the private clone owned by apply; never publishes a notice. */
export function applyCalendar(
	s: State,
	kind: "calendar-holiday" | "calendar-event",
	d: Record<string, string>,
	id: string,
) {
	const required = (key: string) => {
		const value = d[key]?.trim();
		if (!value) throw Error(`Completa ${key}.`);
		return value;
	};
	const date = required("date");
	assertDate(date);
	const title = required("title");
	if (kind === "calendar-holiday") {
		if (s.calendarHolidays.some((holiday) => holiday.date === date))
			throw Error("Ya existe un feriado en esta fecha.");
		s.calendarHolidays.push({ id, date, title });
		return;
	}
	const text = required("text");
	const audience = required("audience");
	const target = audience === "school" ? "" : required("target");
	// Mirrors validateCommunicationTarget without importing its runtime workflows dependency.
	if (audience === "group") {
		if (!s.groups.some((group) => group.id === target))
			throw Error("Selecciona un grupo existente para esta audiencia.");
	} else if (audience === "student") {
		if (!s.students.some((student) => student.id === target))
			throw Error("Selecciona un alumno existente para esta audiencia.");
	} else if (audience !== "school") {
		throw Error("Selecciona una audiencia disponible.");
	}
	const noticeId = `notice-${crypto.randomUUID()}`;
	s.notices.push({
		id: noticeId,
		title,
		text,
		audience,
		target,
		published: false,
		recipients: [],
	});
	s.calendarEvents.push({ id, date, title, noticeId });
}
