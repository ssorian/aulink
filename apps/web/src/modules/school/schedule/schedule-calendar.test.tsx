// @ts-expect-error — Bun runs this test with browser-only app declarations.
import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { apply, initialState } from "../shared/workflows";
import { ScheduleCalendar } from "./schedule-calendar";
import { schoolToday, weekday } from "./schedule-helpers";

function fixture() {
	const s = initialState();
	const today = schoolToday(s.school.timezone);
	s.assignments = [
		{
			id: "a",
			group: "g1",
			subject: "Matemáticas",
			teacher: "Docente del grupo",
			period: "P1",
			min: 0,
			max: 10,
		},
	];
	s.schedules = [
		{
			id: "slot",
			assignment: "a",
			day: weekday(today),
			start: "07:00",
			end: "15:00",
		},
	];
	s.scheduleChanges = [];
	s.scheduleStaffing = [];
	s.scheduleWindows = [];
	s.exceptions = [];
	return { s, today };
}
const render = (
	s: ReturnType<typeof initialState>,
	initialView?: "dates" | "structure",
) =>
	renderToStaticMarkup(
		createElement(ScheduleCalendar, {
			s,
			groupId: "g1",
			open() {},
			initialView,
		}),
	);
const blocks = (html: string) =>
	html.match(/<button\b[^>]*data-slot="schedule-block"[^>]*>/g) || [];

test("only the calendar and its header remain; the lower panels are gone", () => {
	const html = render(fixture().s);
	expect(html).toContain('data-slot="schedule-scroll"');
	expect(html).toContain("Materias");
	expect(html).toContain("Cambios de la semana");
	expect(html).toContain('aria-label="Elegir semana"');
	for (const removed of [
		"schedule-detail",
		"schedule-settings",
		"schedule-series",
		"Configurar minutos",
		"Materias y recurrencias",
		"Horario original e historial",
	])
		expect(html).not.toContain(removed);
	expect(html).toContain(
		"Solo simulación local; no se comunica a terminales ni autoriza entrega de menores",
	);
});

test("dated classes open an options panel and can be dragged; ghosts cannot", () => {
	const { s, today } = fixture();
	const [block] = blocks(render(s));
	expect(block).toContain('aria-haspopup="dialog"');
	expect(block).toContain('draggable="true"');
	expect(block).toContain('aria-label="Matemáticas,');
	expect(block).toContain("Abrir opciones");
	const canceled = apply(s, {
		kind: "schedule-occurrence",
		data: {
			group: "g1",
			schedule: "slot",
			date: today,
			action: "cancel",
			reason: "Prueba",
		},
	});
	const [ghost] = blocks(render(canceled));
	expect(ghost).toContain('draggable="false"');
	expect(ghost).toContain('data-ghost="cancel"');
	expect(ghost).toContain("Cancelada");
	expect(render(canceled)).toMatch(
		/<strong[^>]*>Matemáticas<\/strong>[\s\S]*Cancelada/,
	);
});

test("a per-date substitute is visible on that class", () => {
	const { s, today } = fixture();
	const covered = apply(s, {
		kind: "schedule-staffing",
		data: {
			group: "g1",
			schedule: "slot",
			date: today,
			role: "substitute",
			teacher: "Laura Suplente",
			reason: "Licencia",
		},
	});
	expect(render(covered)).toContain("Suplente: Laura Suplente");
	expect(render(s)).not.toContain("Suplente: Laura Suplente");
});

test("time scale, seven columns and the end-of-day line inside the grid", () => {
	const { s } = fixture();
	const html = render(s);
	expect(html).toContain("height:512px");
	expect((html.match(/data-slot="schedule-day-heading"/g) || []).length).toBe(
		7,
	);
	expect(html).toContain("7:00–15:00");
	expect(html).toMatch(
		/data-slot="schedule-end-line"[^>]*><span[^>]*>Fin 15:00</,
	);
	s.scheduleWindows = [{ group: "g1", before: 10, after: 5 }];
	expect(render(s)).toContain("Salida 14:50–15:05");
	expect(render(s)).toContain('data-slot="schedule-end-band"');
});

test("a subject keeps one colour across periods and differs from other subjects", () => {
	const { s } = fixture();
	s.assignments = [
		{ ...s.assignments[0] },
		{ ...s.assignments[0], id: "a2", period: "P2" },
		{ ...s.assignments[0], id: "h", subject: "Historia" },
	];
	s.schedules = [
		{ ...s.schedules[0], start: "07:00", end: "08:00" },
		{
			...s.schedules[0],
			id: "s2",
			assignment: "a2",
			start: "08:00",
			end: "09:00",
		},
		{
			...s.schedules[0],
			id: "s3",
			assignment: "h",
			start: "09:00",
			end: "10:00",
		},
	];
	const tones = blocks(render(s)).map((b) => b.match(/data-tone="(\d)"/)?.[1]);
	expect(tones[0]).toBe(tones[1]);
	expect(tones[2]).not.toBe(tones[0]);
	expect(
		render(s).match(/data-slot="schedule-subject-name"[^>]*>Matemáticas</g) ||
			[],
	).toHaveLength(1);
});

test("an empty group explains the next step inside the calendar", () => {
	const { s } = fixture();
	s.assignments = [];
	s.schedules = [];
	const html = render(s);
	expect(html).toContain("Este grupo aún no tiene materias");
	expect(html).toMatch(/data-variant="primary"[^>]*>.*Agregar materia/);
});

test("the view switch offers dates and the weekly structure", () => {
	const html = render(fixture().s);
	expect(html).toMatch(/aria-pressed="true"[^>]*>Por fechas</);
	expect(html).toMatch(/aria-pressed="false"[^>]*>Estructura semanal</);
	expect(html).not.toContain("Agregar clase ·");
});

test("structure view shows weekdays without dates, empty slots and the titular", () => {
	const { s } = fixture();
	const html = render(s, "structure");
	expect(html).toMatch(/aria-pressed="true"[^>]*>Estructura semanal</);
	expect(html).toContain("Plantilla que se repite cada semana");
	expect(html).not.toContain("<time");
	expect(html).not.toContain('aria-label="Elegir semana"');
	expect(html).not.toContain("Cambios de la semana");
	expect(html).toContain('aria-label="Agregar clase · Lunes 07:00"');
	expect(html).toContain('aria-label="Agregar clase el lunes"');
	const [block] = blocks(html);
	expect(block).toContain('draggable="true"');
	expect(block).toContain(`cada ${weekday(fixture().today)}`);
	expect(html).toContain("Docente del grupo");
	expect(html).toContain("1 clase");
});

test("the calendar leads the reading order and the side column puts changes before subjects", () => {
	const html = render(fixture().s);
	expect(html.indexOf('data-slot="schedule-main"')).toBeLessThan(
		html.indexOf('data-slot="schedule-aside"'),
	);
	expect(html.indexOf("Cambios de la semana")).toBeLessThan(
		html.indexOf("schedule-subjects-title"),
	);
	expect(html).toMatch(/<label[^>]*title="Docente del grupo"[^>]*data-tone=/);
	expect(html).not.toContain("<small>Docente del grupo</small>");
});

test("the end-of-day line stays subtle when it matches the last class", () => {
	const { s } = fixture();
	expect(render(s)).toMatch(
		/data-slot="schedule-end-line"[^>]*data-subtle="true"[^>]*><span[^>]*>Fin 15:00</,
	);
	s.scheduleWindows = [{ group: "g1", before: 10, after: 5 }];
	expect(render(s)).toMatch(
		/data-slot="schedule-end-line"[^>]*data-subtle="false"/,
	);
});

test("week header is a single row with the view switch and create action", () => {
	const html = render(fixture().s);
	const head = html.match(
		/<header data-slot="schedule-head"[\s\S]*?<\/header>/,
	)?.[0];
	expect(head).toContain("Por fechas");
	expect(head).toContain("Agendar clase");
	expect(html).not.toContain('data-slot="schedule-toolbar"');
});

test("empty Saturday and Sunday get narrow columns; a weekend class widens its day", () => {
	const { s } = fixture();
	s.schedules = [{ ...s.schedules[0], day: "Lunes" }];
	const columns = (html: string) =>
		html.match(
			/data-slot="schedule-grid"[^>]*style="grid-template-columns:([^;"]+)/,
		)?.[1];
	expect(columns(render(s))).toBe(
		`56px ${"minmax(92px, 1fr) ".repeat(5)}56px 56px`,
	);
	expect(render(s)).toMatch(
		/data-slot="schedule-day-heading"[^>]*data-compact="true"/,
	);
	s.schedules.push({ ...s.schedules[0], id: "sat", day: "Sábado" });
	expect(columns(render(s, "structure"))).toBe(
		`56px ${"minmax(92px, 1fr) ".repeat(6)}56px`,
	);
});
