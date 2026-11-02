// @ts-expect-error — Bun runs this test with browser-only app declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CycleCalendar, calendarDays, moveMonth } from "./cycle-calendar";
import { initialState } from "./workflows";
import { cycleDateFields } from "./cycle-dates";
import { FlowDialog } from "./flow-dialog";
import { validateFlow } from "./flow-validation";
import { schoolToday } from "./schedule-helpers";

test("date dialog uses required date fields and contextual range validation", () => {
	const fields = cycleDateFields();
	const html = renderToStaticMarkup(
		<FlowDialog
			flow={{
				kind: "cycle-dates",
				title: "Definir fechas",
				description: "",
				fields,
				values: {},
			}}
			onClose={() => {}}
			onConfirm={() => {}}
		/>,
	);
	expect(html).toContain("Fecha de inicio");
	expect(html).toContain("Fecha de cierre");
	expect(html).toMatch(/id="flow-startDate" type="date" required/);
	expect(html).toMatch(/id="flow-endDate" type="date" required/);
	expect(Object.keys(validateFlow(fields, {}))).toHaveLength(2);
	expect(
		validateFlow(fields, { startDate: "2028-07-02", endDate: "2028-07-01" })
			.endDate,
	).toContain("posterior");
	expect(
		validateFlow(fields, { startDate: "2028-02-29", endDate: "2028-07-01" }),
	).toEqual({});
});

test("calendar weeks start on Monday and include leap day", () => {
	const dates = calendarDays("2028-02");
	expect(dates[0]).toBe("2028-01-31");
	expect(dates).toContain("2028-02-29");
	expect(dates.length % 7).toBe(0);
	expect(dates.at(-1)).toBe("2028-03-05");
});

test("month navigation crosses year boundaries", () => {
	expect(moveMonth("2026-12", 1)).toBe("2027-01");
	expect(moveMonth("2027-01", -1)).toBe("2026-12");
});

test("calendar exposes configuration first, real dates and global scope", () => {
	const s = initialState();
	const html = renderToStaticMarkup(<CycleCalendar s={s} open={() => {}} />);
	expect(html.indexOf("Ciclo escolar")).toBeLessThan(
		html.indexOf("Calendario global"),
	);
	expect(html).toContain('type="month"');
	expect(html).toContain("Mes anterior");
	expect(html).toContain("Mes siguiente");
	expect(html).toContain("Todos los ciclos comparten los días sin clase");
	expect(html).not.toContain("Agregar día sin clase");
	expect(html).toContain('aria-pressed="true"');
	expect(html).toContain('aria-current="date"');
});

test("cycle row orders selector, paired dates and grouped actions above the caption", () => {
	const s = initialState();
	const html = renderToStaticMarkup(<CycleCalendar s={s} open={() => {}} />);
	const card = html.match(
		/<section class="cycle-settings"[^>]*>(.*?)<\/section>/,
	)?.[1];
	expect(card).toMatch(
		/^<div class="cycle-settings-row"><label class="cycle-selector">Ciclo escolar<select/,
	);
	expect(card).toMatch(
		/<\/select><\/label><dl class="cycle-date-metadata">.*?<\/dl><div class="cycle-settings-actions">/,
	);
	expect(card).toMatch(
		/<div class="cycle-settings-actions"><button[^>]*>.*?Crear ciclo<\/button><button[^>]*>Definir fechas<\/button><\/div><\/div><p class="cycle-settings-caption">/,
	);
	const groups = s.groups.filter(
		(group) => group.cycle === s.cycles[0]?.id,
	).length;
	expect(card).toContain(
		`${groups} ${groups === 1 ? "grupo" : "grupos"} en este ciclo. Alumnos y materias se administran en Grupos.`,
	);
	expect(card).not.toContain("cycle-date-row");
	expect(card).not.toContain("Agregar día sin clase");
});

test("one calendar header groups the live month, navigation and month controls", () => {
	const html = renderToStaticMarkup(
		<CycleCalendar s={initialState()} open={() => {}} />,
	);
	const headers = [
		...html.matchAll(/<header class="cycle-month-header">(.*?)<\/header>/g),
	];
	expect(headers).toHaveLength(1);
	const toolbar = headers[0]?.[1];
	expect(toolbar).toMatch(/<h2 aria-live="polite">[^<]+<\/h2>/);
	expect(toolbar).toMatch(/<button[^>]*aria-label="Mes anterior"/);
	expect(toolbar).toMatch(/<button[^>]*aria-label="Mes siguiente"/);
	expect(toolbar).toMatch(/<button[^>]*>Hoy<\/button>/);
	expect(toolbar).toMatch(
		/<input type="month"[^>]*min="0001-01" max="9998-12"/,
	);
	expect(html).not.toMatch(/<h[23][^>]*>Calendario global<\/h[23]>/);
	expect(html).toContain(
		'<section class="cycle-month" aria-label="Calendario global">',
	);
});

test("day details and actions are no longer below the calendar", () => {
	const html = renderToStaticMarkup(
		<CycleCalendar s={initialState()} open={() => {}} />,
	);
	expect(html).not.toContain('class="cycle-day-detail"');
	expect(html).not.toContain('class="cycle-month-events"');
	expect(html).toContain('aria-haspopup="dialog"');
});

test("day labels distinguish visual holidays and events without implying no classes", () => {
	const s = initialState();
	const date = schoolToday(s.school.timezone);
	s.exceptions = [];
	s.calendarHolidays = [{ id: "holiday", date, title: "Celebración escolar" }];
	s.calendarEvents = [
		{ id: "event", date, title: "Reunión de familias", noticeId: "notice" },
	];
	const html = renderToStaticMarkup(<CycleCalendar s={s} open={() => {}} />);
	expect(html).toContain(`id="calendar-day-${date}"`);
	expect(html).toContain("Feriado (solo visual): Celebración escolar");
	expect(html).toContain("Evento: Reunión de familias");
	expect(html).not.toContain("cycle-day-off");
	expect(html).toContain('popover="auto"');
	expect(html).toContain('role="dialog"');
});

test("no cycles still allows using the global calendar", () => {
	const s = initialState();
	s.cycles = [];
	const html = renderToStaticMarkup(<CycleCalendar s={s} open={() => {}} />);
	expect(html).toContain("Sin ciclos registrados");
	expect(html).toContain("Crear ciclo");
	expect(html).toContain("Calendario global");
});

test("cycle card shows unknown dates separately from the month toolbar", () => {
	const html = renderToStaticMarkup(
		<CycleCalendar s={initialState()} open={() => {}} />,
	);
	const card = html.match(
		/<section class="cycle-settings"[^>]*>(.*?)<\/section>/,
	)?.[1];
	expect(card).toContain('<dl class="cycle-date-metadata">');
	expect(card).toContain("<dt>Inicio</dt><dd>Sin definir</dd>");
	expect(card).toContain("<dt>Cierre</dt><dd>Sin definir</dd>");
	expect(card).toContain("Definir fechas");
	expect(card).not.toContain("cycle-month-header");
});

test("cycle dates render semantically without timezone shifts", () => {
	const s = initialState();
	Object.assign(s.cycles[0], {
		startDate: "2028-02-29",
		endDate: "2028-07-01",
	});
	const html = renderToStaticMarkup(<CycleCalendar s={s} open={() => {}} />);
	expect(html).toContain(
		'<time dateTime="2028-02-29">29 de febrero de 2028</time>',
	);
	expect(html).toContain(
		'<time dateTime="2028-07-01">1 de julio de 2028</time>',
	);
	expect(html).toContain("Editar fechas");
	s.cycles = [];
	const empty = renderToStaticMarkup(<CycleCalendar s={s} open={() => {}} />);
	expect(empty).not.toContain("Definir fechas");
	expect(empty).not.toContain("Editar fechas");
});

test("only weekday headings and date buttons share the calendar card", () => {
	const html = renderToStaticMarkup(
		<CycleCalendar s={initialState()} open={() => {}} />,
	);
	expect(html).not.toMatch(/class="[^"]*\bpanel\b/);
	const card = html.match(
		/<div class="cycle-grid-card">(.*?)<div class="cycle-calendar-legend">/,
	)?.[1];
	expect(card).toBeDefined();
	expect(card).toContain('class="cycle-weekdays"');
	expect(card).toContain('class="cycle-days"');
	expect(card).toContain('aria-pressed="true"');
	for (const outside of [
		"<header",
		"<select",
		"<input",
		"Mes anterior",
		"Mes siguiente",
		"Agregar día sin clase",
		"cycle-day-detail",
		"<details",
	]) {
		expect(card).not.toContain(outside);
	}
	expect(html).toContain('class="cycle-settings"');
	expect(html).toContain('class="cycle-month"');
});
