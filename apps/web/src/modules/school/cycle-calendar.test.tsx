// @ts-expect-error — Bun runs this test with browser-only app declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CycleCalendar, calendarDays, moveMonth } from "./cycle-calendar";
import { initialState } from "./workflows";

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
	expect(html).toContain("Agregar día sin clase");
	expect(html).toContain('aria-pressed="true"');
	expect(html).toContain('aria-current="date"');
});

test("no cycles still allows using the global calendar", () => {
	const s = initialState();
	s.cycles = [];
	const html = renderToStaticMarkup(<CycleCalendar s={s} open={() => {}} />);
	expect(html).toContain("Sin ciclos registrados");
	expect(html).toContain("Crear ciclo");
	expect(html).toContain("Calendario global");
});
