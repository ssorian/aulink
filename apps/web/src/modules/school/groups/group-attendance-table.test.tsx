// @ts-expect-error — Bun runs this test with browser-only app declarations.
import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { initialState } from "../shared/workflows";
import { GroupAttendanceTable } from "./group-attendance-table";

const render = (initialMode?: string) =>
	renderToStaticMarkup(
		createElement(GroupAttendanceTable, {
			s: initialState(),
			groupId: "g1",
			open() {},
			initialDate: "2026-10-19",
			initialMode,
		}),
	);

test("status squares carry no letters and the long explanation is replaced by a short legend", () => {
	const html = render();
	const squares =
		html.match(/<button[^>]*data-slot="day-square"[^>]*>[^<]*<\/button>/g) ||
		[];
	expect(squares).toHaveLength(7 * (html.match(/<tr>/g)?.length ?? 1) - 7);
	for (const square of squares) expect(square).toMatch(/><\/button>$/);
	expect(html).not.toContain("Un cuadro por día");
	for (const word of [
		"Entrada y salida",
		"Sin salida",
		"Inasistencia",
		"Por revisar",
		"Sin registro",
	])
		expect(html).toMatch(
			new RegExp(`data-status="[^"]+"[^>]*>(?:<span[^>]*></span>)?${word}<`),
		);
});

test("no date input: a mini calendar picks the date and the top filter switches day, week or month", () => {
	const html = render();
	expect(html).not.toContain('type="date"');
	expect(html).toContain('aria-label="Elegir fecha"');
	expect(html).toMatch(/aria-pressed="true"[^>]*>Semana</);
	expect(html).toMatch(/aria-pressed="false"[^>]*>Día</);
	expect(html).toMatch(/aria-pressed="false"[^>]*>Mes</);
	expect(html.indexOf('data-slot="attendance-main"')).toBeLessThan(
		html.indexOf('aria-label="Elegir fecha"'),
	);
});

test("the table matches the other views and has no background card around it", () => {
	const html = render();
	expect(html).not.toMatch(/class="panel[ "]/);
	expect(html).toContain('class="ui-table-card"');
	expect(html).toContain('class="ui-data-table"');
	expect(html).toContain(">lun 19<");
	const month = render("Mes");
	expect(month.match(/data-slot="day-square"/g)?.length).toBeGreaterThanOrEqual(
		31,
	);
	expect(month).toMatch(/<th scope="col"[^>]*>31</);
});
