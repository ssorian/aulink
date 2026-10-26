// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { filterStaff, StaffView } from "./staff-view";
import { initialState } from "./workflows";

function render(empty = false) {
	const s = initialState();
	s.staff = empty
		? []
		: [
				{
					id: "staff-example",
					name: "Ana Ejemplo",
					role: "Docente",
					history: [
						{
							id: "h1",
							value: "Dirección",
							reason: "Reasignación",
							author: "Control escolar",
						},
						{
							id: "h2",
							value: "Docente",
							reason: "Regreso",
							author: "Dirección escolar",
						},
					],
				},
				{
					id: "staff-other",
					name: "Luis Ejemplo",
					role: "Docente",
					history: [],
				},
			];
	return renderToStaticMarkup(<StaffView s={s} open={() => {}} />);
}

test("staff panel unifies heading, count and primary action with visible disclaimer", () => {
	const html = render();
	expect(html).toMatch(/^<section class="staff-directory"/);
	expect(html).not.toContain('class="panel staff-directory"');
	const header = html.match(/<header[^>]*>(.*?)<\/header>/)?.[1];
	expect(header).toContain("Personal de la escuela");
	expect(header).toContain("2 de 2 registros");
	expect(header).toContain('class="primary"');
	expect(header).toContain("Agregar personal");
	expect(header).toContain("<svg");
	expect(html).toContain(
		'<p class="staff-disclaimer">Estas responsabilidades no implementan autorización. No se envían invitaciones.</p>',
	);
});

test("staff keeps semantic columns, row headers, caption and keyboard scrolling", () => {
	const html = render();
	expect(html).toContain("<caption>Directorio del personal</caption>");
	for (const name of ["Nombre", "Responsabilidad", "Historial", "Acciones"])
		expect(html).toContain(`<th scope="col">${name}</th>`);
	expect(html).toContain(
		'<th scope="row"><span class="directory-identity">Ana Ejemplo</span></th>',
	);
	expect(html).toContain('class="ui-table-scroll"');
	expect(html).toContain('tabindex="0"');
	expect(html).toContain("Desliza para ver todas las columnas");
});

test("staff actions and compact histories name the person and preserve every entry", () => {
	const html = render();
	for (const name of ["Ana Ejemplo", "Luis Ejemplo"])
		expect(html).toContain(`aria-label="Cambiar responsabilidad de ${name}"`);
	expect(html).toContain(
		'aria-label="Ver historial de Ana Ejemplo, 2 cambios">Ver historial (2)</summary>',
	);
	for (const entry of [
		"Dirección · Reasignación · Control escolar",
		"Docente · Regreso · Dirección escolar",
	])
		expect(html).toContain(entry);
	expect(html).toContain(
		'<span class="staff-no-history">Sin cambios registrados</span>',
	);
});

test("empty staff retains the four-column table and recovery", () => {
	const html = render(true);
	expect(html).toContain("0 registros");
	expect(html).toContain('<tbody><tr><td colSpan="4" class="ui-table-empty">');
	expect(html).toContain(
		"Agrega docentes y personal administrativo para organizar tu comunidad.",
	);
});

test("staff supports labeled search and responsibility filters", () => {
	const html = render();
	expect(html).toContain('for="staff-query"');
	expect(html).toContain('for="staff-role"');
	expect(html).toContain('aria-live="polite"');
});

test("staff search ignores accents and combines with responsibility", () => {
	const staff = [
		{ id: "a", name: "María López", role: "Docente", history: [] },
		{ id: "b", name: "Mario López", role: "Dirección", history: [] },
	];
	expect(filterStaff(staff, "  MARIA  ", "").map((x) => x.id)).toEqual(["a"]);
	expect(filterStaff(staff, "lopez", "Dirección").map((x) => x.id)).toEqual([
		"b",
	]);
	expect(filterStaff(staff, "nadie", "")).toEqual([]);
	expect(filterStaff(staff, "", "")).toHaveLength(2);
});

test("only the staff table is a card, not its heading or filters", () => {
	const html = render();
	const card = html.split('<div class="ui-table-card">')[1];
	expect(card).toBeDefined();
	expect(card).toContain('<section class="ui-table-scroll"');
	expect(card).toContain("<table");
	expect(card).not.toContain("<h2>");
	expect(card).not.toContain("Agregar personal");
	expect(card).not.toContain('id="staff-query"');
	expect(render(true).split('<div class="ui-table-card">')[1]).toContain('class="ui-table-empty"');
});
