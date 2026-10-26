// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { GroupDirectory } from "./group-workspace";
import { initialState } from "./workflows";

function render(s = initialState()) {
	return renderToStaticMarkup(
		<GroupDirectory s={s} open={() => {}} onSelect={() => {}} />,
	);
}

test("group directory unifies heading, count, creation, filters and table", () => {
	const s = initialState();
	const html = render(s);
	expect(html).toMatch(/^<section class="panel group-directory"/);
	expect(html).toContain('aria-label="Grupos de la escuela"');
	const header = html.match(/<header[^>]*>(.*?)<\/header>/)?.[1];
	expect(header).toContain("<h2>Grupos de la escuela</h2>");
	expect(header).toContain(
		`${s.groups.length} grupos · Alumnos con inscripción activa en cada ciclo`,
	);
	expect(header).toContain('class="primary"');
	expect(header).toContain("Crear grupo");
	expect(header).toContain("<svg");
	expect(html).toContain('class="group-filters"');
	for (const name of ["Ciclo", "Grado", "Turno"])
		expect(html).toContain(`<label>${name}<select`);
	expect(html.match(/<select/g)).toHaveLength(3);
	expect(html).not.toContain("Limpiar filtros");
});

test("group table preserves six headers, accessible caption and scrolling", () => {
	const s = initialState();
	const html = render(s);
	for (const name of [
		"Grupo",
		"Ciclo",
		"Grado",
		"Turno",
		"Alumnos activos",
		"Acciones",
	])
		expect(html).toContain(`<th scope="col">${name}</th>`);
	expect(html.match(/scope="col"/g)).toHaveLength(6);
	expect(html).toContain("<caption>Directorio de grupos</caption>");
	expect(html).toContain('class="ui-table-scroll"');
	expect(html).toContain('tabindex="0"');
	expect(html).toContain("Desliza para ver todas las columnas");
	for (const g of s.groups) {
		expect(html).toContain(`<th scope="row">${g.name}</th>`);
		expect(html).toContain(`aria-label="Abrir grupo ${g.name}"`);
	}
});

test("counts respect active transfers and distinct cycles with the same year", () => {
	const s = initialState();
	s.groups = [
		{ id: "a", name: "Origen", cycle: "c1", grade: "1", shift: "Matutino" },
		{ id: "b", name: "Destino", cycle: "c1", grade: "1", shift: "Matutino" },
		{
			id: "c",
			name: "Otro ciclo",
			cycle: "c2",
			grade: "2",
			shift: "Vespertino",
		},
		{ id: "d", name: "Sin configurar", cycle: "missing" },
	];
	s.cycles = [
		{ id: "c1", name: "2026–2027 · Primaria" },
		{ id: "c2", name: "2026–2027 · Secundaria" },
	];
	s.students = [
		{
			id: "student",
			name: "Alumno",
			matricula: "001",
			enrollments: [
				{ group: "a", cycle: "c1" },
				{ group: "c", cycle: "c2" },
			],
		},
	];
	s.transfers = [
		{
			id: "transfer",
			student: "student",
			cycle: "c1",
			from: "a",
			to: "b",
			reason: "Cambio",
			author: "Dirección",
		},
	];
	const html = render(s);
	for (const [name, count] of [
		["Origen", 0],
		["Destino", 1],
		["Otro ciclo", 1],
		["Sin configurar", 0],
	]) {
		const row = html.match(
			new RegExp(`<tr><th scope="row">${name}</th>(.*?)</tr>`),
		)?.[1];
		expect(row).toContain(`<td>${count}</td>`);
	}
	for (const cycle of s.cycles)
		expect(html).toContain(`<td>${cycle.name}</td>`);
	for (const fallback of [
		"Ciclo no definido",
		"Grado no definido",
		"Turno no definido",
	])
		expect(html).toContain(`<td>${fallback}</td>`);
});

test("empty groups retain six-column recovery and creation", () => {
	const s = initialState();
	s.groups = [];
	const html = render(s);
	expect(html).toContain("0 grupos");
	expect(html).toContain('<td colSpan="6" class="ui-table-empty">');
	expect(html).toContain("No hay grupos para estos filtros.");
	expect(html).toContain("Crear grupo");
});
