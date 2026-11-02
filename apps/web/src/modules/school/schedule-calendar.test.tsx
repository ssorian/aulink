// @ts-expect-error — Bun runs this test with browser-only app declarations.
import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ScheduleCalendar } from "./schedule-calendar";
import { schoolToday, weekday } from "./schedule-helpers";
import { apply, initialState } from "./workflows";

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
	html.match(/<button\b[^>]*class="schedule-block[^>]*>/g) || [];

test("only the calendar and its header remain; the lower panels are gone", () => {
	const html = render(fixture().s);
	expect(html).toContain('class="schedule-scroll"');
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
	expect(block).toContain('aria-label="Matemáticas');
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
	expect(ghost).toContain("Cancelada");
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

test("compact time scale, seven columns and end-of-day notes are preserved", () => {
	const { s } = fixture();
	const html = render(s);
	expect(html).toContain("height:448px");
	expect((html.match(/class="schedule-day-heading"/g) || []).length).toBe(7);
	expect(html).toContain("07:00–15:00");
	expect(html).toContain("Fin de jornada: 15:00");
	s.scheduleWindows = [{ group: "g1", before: 10, after: 5 }];
	expect(render(s)).toContain("Ventana: 14:50–15:05");
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
	expect(html).toContain("Plantilla de cada semana");
	expect(html).not.toContain("<time");
	expect(html).not.toContain("Ir a fecha");
	expect(html).toContain('aria-label="Agregar clase · Lunes 07:00"');
	const [block] = blocks(html);
	expect(block).toContain('draggable="true"');
	expect(block).toContain(`cada ${weekday(fixture().today)}`);
	expect(html).toContain("Docente del grupo");
	expect(html).toContain("1 clase · fin 15:00");
});
