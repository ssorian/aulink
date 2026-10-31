// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { chipLabel, chipTone } from "./chip-tooltip";
import {
	filterStaff,
	StaffRoleAction,
	StaffView,
	staffWorkload,
} from "./staff-view";
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
	s.assignments = [
		{
			id: "a1",
			subject: "Matemáticas",
			teacher: "Ana Ejemplo",
			period: "P1",
			group: "g1",
			min: 0,
			max: 10,
		},
		{
			id: "a2",
			subject: "Matemáticas",
			teacher: "Ana Ejemplo",
			period: "P2",
			group: "g1",
			min: 0,
			max: 10,
		},
		{
			id: "a3",
			subject: "Física",
			teacher: "Ana Ejemplo",
			period: "P1",
			group: "g2",
			min: 0,
			max: 10,
		},
	];
	s.schedules = [
		{ id: "h1", assignment: "a1", day: "Lunes", start: "08:00", end: "09:00" },
		{ id: "h2", assignment: "a2", day: "Lunes", start: "08:00", end: "09:00" },
		{ id: "h3", assignment: "a3", day: "Martes", start: "10:00", end: "11:30" },
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
	for (const name of [
		"Nombre",
		"Responsabilidad",
		"Materias",
		"Grupos",
		"Horas/semana",
		"Acciones",
	])
		expect(html).toContain(`<th scope="col">${name}</th>`);
	expect(html).not.toContain('<th scope="col">Historial</th>');
	expect(html).toContain(
		'<th scope="row"><span class="directory-identity">Ana Ejemplo</span></th>',
	);
	expect(html).toContain('class="ui-table-scroll"');
	expect(html).toContain('tabindex="0"');
	expect(html).toContain("Desliza para ver todas las columnas");
});

test("staff actions use the brick open button and name the person", () => {
	const html = render();
	for (const name of ["Ana Ejemplo", "Luis Ejemplo"])
		expect(html).toMatch(
			new RegExp(
				`<button type="button" class="directory-open" aria-label="Cambiar responsabilidad de ${name}"><svg[^>]*aria-hidden="true"[\\s\\S]*?</svg></button>`,
			),
		);
	expect(html).not.toContain("<details");
	expect(html).toContain('<span class="staff-history-count">2 cambios</span>');
});

test("open passes every history entry to the dialog", () => {
	const calls: unknown[][] = [];
	const s = initialState();
	s.staff = [
		{
			id: "x",
			name: "Ana Ejemplo",
			role: "Docente",
			history: [
				{
					id: "h",
					value: "Dirección",
					reason: "Reasignación",
					author: "Control escolar",
				},
			],
		},
	];
	const el = StaffRoleAction({
		person: s.staff[0],
		open: (...a) => calls.push(a),
	});
	el.props.onClick();
	expect(calls[0][1]).toBe("Cambiar responsabilidad de Ana Ejemplo");
	expect(calls[0][5]).toBe(
		"Historial: Dirección · Reasignación · Control escolar.",
	);
	const none = StaffRoleAction({
		person: { ...s.staff[0], history: [] },
		open: (...a) => calls.push(a),
	});
	none.props.onClick();
	expect(calls.at(-1)?.[5]).toBe("Sin cambios registrados.");
});

test("workload derives subjects, groups and weekly hours from assignments", () => {
	const s = initialState();
	s.assignments = [
		{
			id: "a1",
			subject: "Matemáticas",
			teacher: "Ana",
			period: "P1",
			group: "g1",
			min: 0,
			max: 10,
		},
		{
			id: "a2",
			subject: "Matemáticas",
			teacher: "Ana",
			period: "P2",
			group: "g1",
			min: 0,
			max: 10,
		},
		{
			id: "a3",
			subject: "Física",
			teacher: "Ana",
			period: "P1",
			group: "g2",
			min: 0,
			max: 10,
		},
		{
			id: "a4",
			subject: "Química",
			teacher: "Otro",
			period: "P1",
			group: "g2",
			min: 0,
			max: 10,
		},
	];
	s.schedules = [
		{ id: "h1", assignment: "a1", day: "Lunes", start: "08:00", end: "09:00" },
		{ id: "h2", assignment: "a2", day: "Lunes", start: "08:00", end: "09:00" },
		{ id: "h3", assignment: "a3", day: "Martes", start: "10:00", end: "11:30" },
	];
	expect(staffWorkload(s, "Ana")).toEqual({
		subjects: ["Matemáticas", "Física"],
		groups: ["1° A", "2° B"],
		hours: 2.5,
	});
	expect(staffWorkload(s, "Nadie")).toEqual({
		subjects: [],
		groups: [],
		hours: 0,
	});
	s.groups[1].cycle = "old";
	s.cycles.push({ id: "old", name: "2020–2021" });
	expect(staffWorkload(s, "Ana").groups).toEqual(["1° A"]);
});

test("subjects and groups open a tooltip of colored cards", () => {
	const html = render();
	expect(html).toMatch(
		/<button type="button" class="chip-tooltip-trigger stripe-border" aria-label="2 materias" aria-describedby="([^"]+)">2<\/button><ul role="tooltip" id="\1" class="chip-tooltip">/,
	);
	expect(html).toContain('aria-label="2 grupos"');
	expect(html).not.toContain(">2 materias</button>");
	for (const name of ["Matemáticas", "Física", "1° A", "2° B"])
		expect(html).toMatch(
			new RegExp(`<li class="chip tone-[a-z]+">${name}</li>`),
		);
	expect(html).not.toContain("Matemáticas, Física");
	expect(html).toContain("<td>2.5</td>");
	expect(html).toContain("<td>—</td><td>—</td><td>—</td>");
});

test("singular labels and stable colors per name", () => {
	expect(chipLabel(1, "materia", "materias")).toBe("1 materia");
	expect(chipLabel(3, "grupo", "grupos")).toBe("3 grupos");
	expect(chipTone("Matemáticas")).toBe(chipTone("Matemáticas"));
	const tones = new Set(
		[
			"Matemáticas",
			"Física",
			"Química",
			"Historia",
			"Arte",
			"1° A",
			"2° B",
		].map(chipTone),
	);
	expect(tones.size).toBeGreaterThan(1);
});

test("empty staff retains the six-column table and recovery", () => {
	const html = render(true);
	expect(html).toContain("0 registros");
	expect(html).toContain('<tbody><tr><td colSpan="6" class="ui-table-empty">');
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
	expect(render(true).split('<div class="ui-table-card">')[1]).toContain(
		'class="ui-table-empty"',
	);
});
