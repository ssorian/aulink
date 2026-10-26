// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StudentsView } from "./students-view";
import { initialState, previewCSV } from "./workflows";

function render(overrides: Partial<ComponentProps<typeof StudentsView>> = {}) {
	const s = initialState();
	s.students[0].name = "Ana Ejemplo";
	s.students[0].matricula = "DEMO-001";
	s.cycles.push({ id: "past", name: "2025–2026" });
	s.groups.push({
		...s.groups[0],
		id: "past-group",
		cycle: "past",
		name: "Histórico",
	});
	s.students[0].enrollments.push({ group: "past-group", cycle: "past" });
	return renderToStaticMarkup(
		<StudentsView
			s={s}
			open={() => {}}
			groups={{ key: "group", label: "Grupo" }}
			groupName={(id) => s.groups.find((g) => g.id === id)?.name || "Sin grupo"}
			query=""
			setQuery={() => {}}
			groupFilter=""
			setGroupFilter={() => {}}
			profile=""
			setProfile={() => {}}
			selected={undefined}
			csv=""
			setCSV={() => {}}
			csvPreview={false}
			setCSVPreview={() => {}}
			rows={[]}
			visible={s.students}
			addStudent={() => {}}
			cycleFilter="c1"
			onCycleFilterChange={() => {}}
			onClearFilters={() => {}}
			{...overrides}
		/>,
	);
}

test("directory owns its heading, actions and three explicitly labeled filters", () => {
	const html = render();
	expect(html).toMatch(/^<section[^>]*aria-label="Directorio de alumnos"/);
	expect(html).toContain("<h2>Directorio de alumnos</h2>");
	expect(html).not.toContain('class="panel student-directory"');
	expect(html).toContain("2 de 2 alumnos");
	for (const label of [
		"Buscar alumno",
		"Ciclo del directorio",
		"Filtrar grupo",
	]) {
		expect(html).toContain(label);
	}
	expect(html).toContain('for="directory-query"');
	expect(html).toContain('for="directory-cycle"');
	expect(html).toContain('for="directory-group"');
	expect(html).toContain("Inscribir alumno");
	expect(html).toMatch(
		/aria-expanded="false" aria-controls="directory-import"/,
	);
});

test("selected cycle keeps rows focused and the name opens the profile", () => {
	const html = render();
	const body = html.split("<tbody>")[1];
	expect(body).not.toContain("Histórico");
	expect(body).not.toContain("2025–2026");
	expect(body).not.toContain("2026–2027");
	expect(body).toMatch(/Ana Ejemplo<\/button><span[^>]*>DEMO-001<\/span>/);
	expect(html).not.toContain('<th scope="col">Matrícula</th>');
	expect(html).toContain('id="student-s1"');
	expect(html).toContain('aria-label="Abrir Ana Ejemplo"');
	expect(html).not.toContain('<th scope="col">Expediente</th>');
	expect(html).toContain(
		'tabindex="0" aria-label="Resultados de alumnos, desplazamiento horizontal"',
	);
	expect(html).toContain("Alumnos y grupos históricos por ciclo escolar");
});

test("all cycles explicitly preserves historical enrollments", () => {
	const body = render({ cycleFilter: "" }).split("<tbody>")[1];
	expect(body).toContain("Histórico");
	expect(body).toContain("2026–2027");
	expect(body).toContain("2025–2026");
});

test("active filters are individually removable and search can be cleared", () => {
	const html = render({ query: "Ana", groupFilter: "g1" });
	for (const label of [
		"Limpiar búsqueda",
		"Quitar filtro de ciclo",
		"Quitar filtro de grupo",
	])
		expect(html).toContain(`aria-label="${label}"`);
});

test("empty results retain recovery and a live count", () => {
	const html = render({ visible: [], query: "nadie" });
	expect(html).toContain('aria-live="polite">0 de 2 alumnos');
	expect(html).toContain("No se encontraron alumnos");
	expect(html).toContain("Limpiar filtros");
});

test("CSV expansion exposes errors and only enables review for valid rows", () => {
	const invalid = render({
		csvPreview: true,
		rows: previewCSV(initialState(), "Nombre,Matrícula,Grupo\nAna,,g1"),
	});
	expect(invalid).toMatch(
		/aria-expanded="true" aria-controls="directory-import"/,
	);
	expect(invalid).toContain('id="directory-import"');
	expect(invalid).toContain('class="error"');
	expect(invalid).toMatch(/disabled="">Revisar filas válidas \(0\)/);
	const valid = render({
		csvPreview: true,
		rows: previewCSV(initialState(), "Nombre,Matrícula,Grupo\nNueva,N-1,g1"),
	});
	expect(valid).toContain("Revisar filas válidas (1)");
	expect(valid).not.toContain('disabled=""');
});

test("only the student table is a card, including empty recovery", () => {
	const html = render({ visible: [], query: "nadie" });
	const card = html.split('<div class="ui-table-card">')[1];
	expect(card).toBeDefined();
	expect(card).toContain('class="ui-table-scroll table-scroll"');
	expect(card).toContain('<td colSpan="2" class="ui-table-empty">No se encontraron alumnos.');
	expect(card).not.toContain("<h2>");
	expect(card).not.toContain('class="directory-filters"');
	expect(card).not.toContain("Limpiar filtros");
	expect(html.match(/No se encontraron alumnos/g)).toHaveLength(1);
});
