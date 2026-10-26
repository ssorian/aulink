// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { StaffView } from "./staff-view";
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
	expect(html).toMatch(/^<section class="panel staff-directory"/);
	const header = html.match(/<header[^>]*>(.*?)<\/header>/)?.[1];
	expect(header).toContain("Personal de la escuela");
	expect(header).toContain("Docentes y personal administrativo · 2 registros");
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
	expect(html).toContain('<th scope="row">Ana Ejemplo</th>');
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
