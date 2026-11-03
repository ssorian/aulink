// @ts-expect-error — Bun runs this test with browser-only app declarations.
import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GroupGradesTable } from "./group-grades-table";
import { initialState } from "./workflows";

function render() {
	const s = initialState();
	s.assignments = [
		{
			id: "a1",
			subject: "Historia",
			period: "P1",
			teacher: "Demo",
			min: 0,
			max: 10,
			group: "g1",
		},
		{
			id: "a2",
			subject: "Historia",
			period: "P2",
			teacher: "Demo",
			min: 0,
			max: 10,
			group: "g1",
		},
	];
	s.grades = [
		{
			id: "r",
			student: "s1",
			assignment: "a1",
			value: 8,
			published: false,
			history: [],
		},
	];
	return renderToStaticMarkup(
		createElement(GroupGradesTable, { s, groupId: "g1", open() {} }),
	);
}

test("no audit section, no capture buttons and no background card", () => {
	const html = render();
	expect(html).not.toContain(
		"Auditoría, publicación y correcciones con motivo",
	);
	expect(html).not.toContain("Capturar");
	expect(html).not.toContain("Corregir con motivo");
	expect(html).not.toMatch(/class="panel[ "]/);
	expect(html).toContain('class="ui-table-card"');
	expect(html).toContain('class="ui-data-table"');
});

test("filters sit on top and a short dot legend replaces the long explanation", () => {
	const html = render();
	expect(html).not.toContain(
		"Promedio simple por materia, solo con la misma escala",
	);
	expect(html.indexOf('class="grades-toolbar"')).toBeLessThan(
		html.indexOf('class="ui-table-card"'),
	);
	expect(html).toMatch(/aria-pressed="true"[^>]*>Total</);
	expect(html).toMatch(/aria-pressed="false"[^>]*>P1</);
	for (const word of ["Publicado", "Borrador", "Sin captura"])
		expect(html).toMatch(new RegExp(`data-state="[^"]+">${word}<`));
});

test("a draft grade shows its value with a state dot and keeps the state in its accessible name", () => {
	const html = render();
	expect(html).toMatch(
		/<span class="grade-value" data-state="draft" title="Borrador">8<\/span>/,
	);
	expect(html).toContain("Parcial");
});
