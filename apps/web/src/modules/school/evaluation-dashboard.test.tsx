// @ts-expect-error Bun runs these tests; browser compilation excludes its types.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { EvaluationDashboard } from "./evaluation-dashboard";
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
			s={s}
			cycleId={cycleId}
			onCycleChange={() => {}}
			onOpenGroup={() => {}}
		/>,
	);
}
test("analytics charts precede the semantic results table with explicit filters", () => {
	const html = render();
	for (const text of [
		"Resultados académicos",
		"Promedio por evaluación",
		"Comparación por grupo",
		"Resultados por grupo, evaluación y materia",
	])
		expect(html).toContain(text);
	expect(html.indexOf("Comparación por grupo")).toBeLessThan(
		html.indexOf("<table"),
	);
	for (const id of ["cycle", "scale", "period", "subject"])
		expect(html).toContain(`for="evaluation-${id}"`);
	expect(html).not.toContain('value="">Todos');
	expect(html).toContain(
		'aria-label="Abrir grupo 1° A · Matemáticas · Primera"',
	);
});
test("published zero is a result, drafts are absent and scales never combine", () => {
	const html = render();
	expect(html).toContain('class="evaluation-mean">0</strong>');
	expect(html).toContain("1 calificación publicada");
	expect(html).toContain("Sin resultados publicados");
	expect(html).not.toContain("7.777");
	expect(html).not.toContain(">95<");
	expect(html).not.toContain("<td>Otra escala</td>");
	expect(html).toContain("Escala 0–100");
	expect(html).toContain('style="width:0%"');
});
test("empty data explains publication without fabricating group links", () => {
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
	expect(html).not.toContain("<td>Matemáticas</td>");
});
test("school average has its own named chart with raw scale boundaries", () => {
	const s = fixture();
	s.assignments[0].min = 5;
	s.grades[0].value = 8;
	const html = render(s);
	const chart =
		html
			.split('aria-labelledby="evaluation-school-chart"')[1]
			?.split("</figure>")[0] || "";
	expect(chart).toContain("Promedio escolar");
	expect(chart).toContain('class="evaluation-mean">8</strong>');
	expect(chart).toContain('style="width:60%"');
	expect(chart).toContain("Mínimo 5");
	expect(chart).toContain("Máximo 10");
	expect(chart).toContain("1 calificación publicada");
});

function groupFixture(count: number) {
	const s = fixture();
	s.groups = Array.from({ length: count }, (_, index) => ({
		id: `group-${index}`,
		name: `Grupo ${index + 1}`,
		cycle: "c1",
	}));
	s.assignments = s.groups.map((group, index) => ({
		...s.assignments[0],
		id: `assignment-${index}`,
		group: group.id,
	}));
	s.grades = s.assignments.map((assignment, index) => ({
		...s.grades[0],
		id: `grade-${index}`,
		assignment: assignment.id,
		value: index,
	}));
	return s;
}

test("five groups remain in normal flow and one period does not repeat the school plot", () => {
	const html = render(groupFixture(5));
	const chart =
		html
			.split('aria-labelledby="evaluation-group-chart"')[1]
			?.split("</figure>")[0] || "";
	expect(chart.match(/<li/g)?.length).toBe(5);
	for (let index = 1; index <= 5; index++)
		expect(chart).toContain(`Abrir grupo Grupo ${index}`);
	expect(chart).not.toContain("evaluation-chart-scroll");
	expect(chart).not.toContain('tabindex="0"');
	expect(html).not.toContain('id="evaluation-period-chart"');
	expect(html).toContain("Primera");
	expect(render()).toContain('id="evaluation-period-chart"');
});

test("large group comparisons expose continuation and keyboard scrolling", () => {
	const html = render(groupFixture(9));
	const chart =
		html
			.split('aria-labelledby="evaluation-group-chart"')[1]
			?.split("</figure>")[0] || "";
	expect(chart).toContain("evaluation-chart-scroll");
	expect(chart).toContain('tabindex="0"');
	expect(chart).toContain("9 resultados · Desplaza para ver todos");
});

test("diagnostics explicitly describe global exclusions and retained duplicates", () => {
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
