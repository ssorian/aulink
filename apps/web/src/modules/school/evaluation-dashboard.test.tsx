// @ts-expect-error Bun runs these tests; browser compilation excludes its types.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { EvaluationDashboard } from "./evaluation-dashboard";
import {
	buildEvaluationData,
	buildEvaluationMatrix,
	summarizeEvaluation,
} from "./evaluation-results";
import { initialState, type State } from "./workflows";

function fixture() {
	const s = initialState();
	s.assignments = [
		{
			id: "zero",
			group: "g1",
			period: "Primera",
			subject: "Matemáticas",
			min: 0,
			max: 10,
			teacher: "Docente",
		},
		{
			id: "draft",
			group: "g2",
			period: "Segunda",
			subject: "Arte",
			min: 0,
			max: 10,
			teacher: "Docente",
		},
		{
			id: "other",
			group: "g1",
			period: "Porcentaje",
			subject: "Otra escala",
			min: 0,
			max: 100,
			teacher: "Docente",
		},
	];
	s.grades = [
		{
			id: "published",
			assignment: "zero",
			student: "s1",
			value: 0,
			published: true,
			history: [],
		},
		{
			id: "unpublished",
			assignment: "draft",
			student: "s1",
			value: 7.777,
			published: false,
			history: [],
		},
		{
			id: "percent",
			assignment: "other",
			student: "s1",
			value: 95,
			published: true,
			history: [],
		},
	];
	return s;
}
function render(s: State = fixture(), cycleId = "c1") {
	return renderToStaticMarkup(
		<EvaluationDashboard
			initialTab="Resultados"
			s={s}
			cycleId={cycleId}
			onCycleChange={() => {}}
			onOpenGroup={() => {}}
		/>,
	);
}

function operationalFixture() {
	const s = initialState();
	s.assignments = [
		{
			id: "m",
			group: "g1",
			period: "P1",
			subject: "Matemáticas",
			teacher: "Docente A",
			min: 0,
			max: 10,
		},
		{
			id: "l",
			group: "g1",
			period: "P1",
			subject: "Lengua",
			teacher: "Docente B",
			min: 0,
			max: 10,
		},
		{
			id: "a",
			group: "g2",
			period: "P1",
			subject: "Arte",
			teacher: "Docente C",
			min: 0,
			max: 10,
		},
	];
	s.grades = [
		{
			id: "m1",
			assignment: "m",
			student: "s1",
			value: 5,
			published: true,
			history: [],
		},
		{
			id: "l1",
			assignment: "l",
			student: "s1",
			value: 4,
			published: false,
			history: [],
		},
	];
	return s;
}
function renderOperational(
	s: State,
	tab?: "Avance del periodo" | "Alumnos en riesgo" | "Resultados",
) {
	return renderToStaticMarkup(
		<EvaluationDashboard
			s={s}
			cycleId="c1"
			onCycleChange={() => {}}
			onOpenGroup={() => {}}
			onOpenStudent={() => {}}
			open={() => {}}
			initialTab={tab}
		/>,
	);
}
test("progress presents publication and teacher pending with a single period", () => {
	const html = renderOperational(operationalFixture());
	for (const text of [
		"Avance de P1",
		"1 de 3 calificaciones publicadas",
		"Publicar 1 borrador",
		"Sin captura",
		"por publicar",
		"Pendientes por docente",
		"Docente B",
	])
		expect(html).toContain(text);
	expect(html).not.toContain("<h2>Evaluación del ciclo</h2>");
	expect(html).toContain('aria-label="Evaluación del ciclo"');
	expect(html).toContain("1 de 1 publicadas");
	for (const status of ["published", "draft", "missing"])
		expect(html).toContain(`evaluation-legend-swatch evaluation-bar-${status}`);
	expect(html).not.toContain("Todos los periodos");
	expect(renderOperational(operationalFixture(), "Resultados")).toContain(
		"Todos los periodos",
	);
});
test("risk includes failing drafts and explains its criterion", () => {
	const html = renderOperational(operationalFixture(), "Alumnos en riesgo");
	for (const text of [
		"En riesgo: 2 o más materias con calificación menor a 6.",
		"Matemáticas 5",
		'Lengua 4 · <span class="evaluation-draft-tag">borrador</span>',
		"1 alumno en riesgo",
		"2 evaluados",
		"Ver expediente",
	])
		expect(html).toContain(text);
});
test("risk empty state explains other failures", () => {
	const s = operationalFixture();
	s.grades[1].value = 8;
	const html = renderOperational(s, "Alumnos en riesgo");
	expect(html).toContain("Ningún alumno cumple el criterio");
	expect(html).toContain("1 alumno tiene al menos una materia reprobada");
});

test("risk summary pluralizes risk and evaluated counts", () => {
	const s = operationalFixture();
	s.students = s.students.filter((student) => student.id === "s1");
	const singular = renderOperational(s, "Alumnos en riesgo");
	expect(singular).toContain("1 alumno en riesgo");
	expect(singular).toContain("1 evaluado");
	s.students.push({
		id: "s3",
		name: "Ejemplo",
		matricula: "M3",
		enrollments: [{ group: "g1", cycle: "c1" }],
	});
	s.grades.push(
		{ ...s.grades[0], id: "m3", student: "s3" },
		{ ...s.grades[1], id: "l3", student: "s3" },
	);
	const plural = renderOperational(s, "Alumnos en riesgo");
	expect(plural).toContain("2 alumnos en riesgo");
	expect(plural).toContain("2 evaluados");
});

test("group and subject charts are primary, with the matrix collapsed below", () => {
	const html = render();
	for (const text of [
		"Resultados publicados",
		"Promedio publicado",
		"Resultados por grupo y materia",
		"Promedio por grupo",
		"Promedio por materia",
		"Ver tabla de resultados",
		"Todos los periodos",
	])
		expect(html).toContain(text);
	for (const id of ["cycle", "scale", "period", "subject", "group", "sort"])
		expect(html).toContain(`for="evaluation-${id}"`);
	expect(html).toContain('class="evaluation-charts"');
	expect(html.indexOf('id="evaluation-group-chart"')).toBeLessThan(
		html.indexOf('class="evaluation-table-detail"'),
	);
	expect(html.indexOf('id="evaluation-subject-chart"')).toBeLessThan(
		html.indexOf('class="evaluation-table-detail"'),
	);
	expect(html).toContain('<details class="evaluation-table-detail">');
	expect(html).toContain('aria-label="Abrir grupo 1° A"');
	expect(html).not.toContain("evaluation-track");
	expect(html).not.toContain('<th scope="col">Acción');
	expect(html).toContain('id="evaluation-group-chart"');
});

test("published zero remains numeric, missing and draft values are dashes", () => {
	const html = render();
	expect(html).toContain('class="evaluation-mean">0</strong>');
	expect(html).toContain("Calificaciones publicadas");
	expect(html).toContain('aria-hidden="true">—');
	expect(html).toContain(
		'class="evaluation-sr-only">Sin resultados publicados',
	);
	expect(html).not.toContain("7.777");
	expect(html).not.toContain(">95<");
	expect(html).not.toContain('<th scope="col">Otra escala</th>');
	expect(html).toContain("Escala 0–100");
});

test("single scale is context rather than an unnecessary selector", () => {
	const s = fixture();
	s.assignments.pop();
	const html = render(s);
	expect(html).not.toContain('id="evaluation-scale"');
	expect(html).toContain("Escala 0–10");
});

test("empty data explains publication without fabricating group links or zero", () => {
	const s = initialState();
	s.groups = [];
	s.assignments = [];
	s.grades = [];
	const html = render(s);
	expect(html).toContain("Sin resultados publicados");
	expect(html).toContain("Publica calificaciones desde el espacio de un grupo");
	expect(html).not.toContain("Abrir grupo");
	expect(html).not.toContain('class="evaluation-mean">0');
});

test("cycle-specific scales fall back to the available scale only", () => {
	const s = fixture();
	s.cycles.push({ id: "next", name: "Siguiente ciclo" });
	s.groups.push({ id: "next-group", name: "Grupo futuro", cycle: "next" });
	s.assignments[2].group = "next-group";
	const html = render(s, "next");
	expect(html).toContain('class="evaluation-mean">95</strong>');
	expect(html).not.toContain("Escala 0–10</option>");
	expect(html).not.toContain('<option value="Matemáticas">');
});

test("group filter confines all aggregates and matrix cells", () => {
	const report = summarizeEvaluation(buildEvaluationData(fixture()), {
		cycleId: "c1",
		scaleKey: "[0,10]",
		groupId: "g2",
	});
	expect(report.mean).toBeNull();
	expect(report.count).toBe(0);
	expect(report.byGroup.map((group) => group.key)).toEqual(["g2"]);
	expect(report.rows.every((row) => row.groupId === "g2")).toBe(true);
});

test("matrix combines periods by published record count, not by row means", () => {
	const s = fixture();
	s.assignments.push({ ...s.assignments[0], id: "later", period: "Segunda" });
	s.grades.push(
		{ ...s.grades[0], id: "a", assignment: "later", value: 9 },
		{ ...s.grades[0], id: "b", assignment: "later", value: 9 },
	);
	const report = summarizeEvaluation(buildEvaluationData(s), {
		cycleId: "c1",
		scaleKey: "[0,10]",
	});
	const matrix = buildEvaluationMatrix(report);
	expect(matrix.subjects).toEqual(["Arte", "Matemáticas"]);
	expect(matrix.groups[0].cells.get("Matemáticas")).toEqual({
		mean: 6,
		count: 3,
	});
	expect(matrix.groups[1].cells.get("Arte")).toEqual({ mean: null, count: 0 });
	expect(matrix.groups[1].cells.has("Matemáticas")).toBe(false);
	expect(matrix.bySubject).toEqual([
		{ key: "Arte", label: "Arte", mean: null, count: 0 },
		{ key: "Matemáticas", label: "Matemáticas", mean: 6, count: 3 },
	]);
});

test("subject chart weights records across groups and follows combined filters", () => {
	const s = fixture();
	s.assignments[1].subject = "Matemáticas";
	s.assignments[1].period = "Primera";
	s.grades[1].published = true;
	s.grades[1].value = 9;
	s.grades.push({ ...s.grades[1], id: "another", value: 9 });
	const data = buildEvaluationData(s);
	const filters = {
		cycleId: "c1",
		scaleKey: "[0,10]",
		period: "Primera",
		subject: "Matemáticas",
	};
	const all = buildEvaluationMatrix(summarizeEvaluation(data, filters));
	expect(all.bySubject[0]).toEqual({
		key: "Matemáticas",
		label: "Matemáticas",
		mean: 6,
		count: 3,
	});
	const group = buildEvaluationMatrix(
		summarizeEvaluation(data, { ...filters, groupId: "g1" }),
	);
	expect(group.bySubject[0].mean).toBe(0);
	expect(group.bySubject[0].count).toBe(1);
	expect(
		buildEvaluationMatrix(
			summarizeEvaluation(data, { ...filters, groupId: "missing" }),
		).bySubject,
	).toEqual([]);
});

test("diagnostics remain explicit about global exclusions and retained duplicates", () => {
	const s = fixture();
	s.grades.push(
		{ ...s.grades[0], id: "duplicate" },
		{ ...s.grades[0], id: "invalid", value: 11 },
	);
	const html = render(s);
	expect(html).toContain("Diagnóstico global");
	expect(html).toContain("1 registros publicados excluidos");
	expect(html).toContain("1 duplicados válidos contados por separado");
	expect(html).toContain("no representan alumnos ni cobertura");
});
