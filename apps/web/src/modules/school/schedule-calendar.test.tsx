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
	s.scheduleWindows = [];
	s.exceptions = [];
	return { s, today };
}
const render = (s: ReturnType<typeof initialState>) =>
	renderToStaticMarkup(
		createElement(ScheduleCalendar, { s, groupId: "g1", open() {} }),
	);

test("class blocks are accessible buttons linked to the detail below the calendar", () => {
	const html = render(fixture().s);
	const block = html.match(/<button\b[^>]*class="schedule-block[^>]*>/)?.[0];
	expect(block).toBeDefined();
	expect(block).toContain('type="button"');
	expect(block).toContain('aria-label="Matemáticas');
	const detailId = html.match(
		/<section[^>]*class="schedule-detail"[^>]*id="([^"]+)"/,
	)?.[1];
	expect(detailId).toBeDefined();
	expect(block).toContain(`aria-controls="${detailId}"`);
	expect(html.indexOf('class="schedule-detail"')).toBeGreaterThan(
		html.indexOf('class="schedule-scroll"'),
	);
});

test("compact time scale preserves the true eight-hour duration and seven-day grid", () => {
	const html = render(fixture().s);
	expect(html).toContain("height:448px");
	expect(html).not.toContain("height:960px");
	expect((html.match(/class="schedule-day-heading"/g) || []).length).toBe(7);
	expect(html).toContain("Desliza horizontalmente para ver toda la semana");
	expect(html).toContain("07:00–15:00");
});

test("zero margins show a clear endpoint while real margins retain the window", () => {
	const { s } = fixture();
	expect(render(s)).toContain("Fin de jornada: 15:00");
	expect(render(s)).not.toContain("15:00–15:00");
	s.scheduleWindows = [{ group: "g1", before: 10, after: 5 }];
	expect(render(s)).toContain("Ventana: 14:50–15:05");
});

test("secondary configuration is collapsed without removing simulation or audited actions", () => {
	const { s, today } = fixture();
	const html = render(s);
	expect(html).toContain('<details class="schedule-settings"><summary>');
	expect(html).toContain("Configurar minutos");
	expect(html).toContain(
		"Solo simulación local; no se comunica a terminales ni autoriza entrega de menores",
	);
	expect(html).toContain("Cancelar clase");
	expect(html).toContain("Reagendar clase");
	expect(html).toContain("Horario original e historial");
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
	expect(render(canceled)).toContain("Restaurar ocurrencia");
	expect(render(canceled)).toContain("Cancelada");
});
