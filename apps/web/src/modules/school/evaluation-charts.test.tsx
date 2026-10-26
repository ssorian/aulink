// @ts-expect-error Bun runs these tests; browser compilation excludes its types.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { EvaluationCharts } from "./evaluation-charts";
import type { EvaluationBucket, EvaluationScale } from "./evaluation-results";

const scale = { key: "[0,10]", min: 0, max: 10, label: "Escala 0–10" };
function render(
	mean: number | null,
	activeScale: EvaluationScale | undefined = scale,
) {
	const bucket: EvaluationBucket = {
		key: "group",
		label: "Grupo A",
		mean,
		count: mean === null ? 0 : 3,
	};
	return renderToStaticMarkup(
		<EvaluationCharts
			groups={[bucket]}
			subjects={[{ ...bucket, label: "Matemáticas" }]}
			scale={activeScale}
			mean={mean}
			onOpenGroup={() => {}}
		/>,
	);
}

test("both charts show raw-scale values and published counts with a mean reference", () => {
	const html = render(8.5);
	expect(html).toContain('style="height:85%"');
	expect(html).toContain('style="width:85%"');
	expect(html).toContain('style="bottom:85%"');
	expect(html).toContain('aria-label="Abrir grupo Grupo A"');
	expect(html).toContain("3 calificaciones publicadas");
	expect(html).toContain("Promedio general:");
	expect(html).toContain("8.5");
});

test("missing values do not draw bars or the mean reference", () => {
	const html = render(null);
	expect(html).toContain("Sin resultados publicados");
	expect(html).not.toContain('class="evaluation-column-bar"');
	expect(html).not.toContain('class="evaluation-subject-bar"');
	expect(html).not.toContain('class="evaluation-mean-line"');
});

test("published zero is distinct from a missing result", () => {
	const html = render(0);
	expect(html).toContain('style="height:0%"');
	expect(html).toContain('style="width:0%"');
	expect(html).toContain("Promedio:");
	expect(html).not.toContain("Sin resultados publicados");
});

test("truncated and negative scales are explicit and retain the same coordinates", () => {
	const truncated = render(8, {
		key: "[5,10]",
		min: 5,
		max: 10,
		label: "Escala 5–10",
	});
	expect(truncated).toContain("El eje comienza en 5, no en cero.");
	expect(truncated).toContain('style="height:60%"');
	const negative = render(0, {
		key: "[-5,5]",
		min: -5,
		max: 5,
		label: "Escala -5–5",
	});
	expect(negative).toContain('style="height:50%"');
	expect(negative).toContain("Escala de -5 a 5");
});

test("no scale or no assignments never fabricates plot data", () => {
	const noScale = renderToStaticMarkup(
		<EvaluationCharts
			groups={[]}
			subjects={[]}
			scale={undefined}
			mean={null}
			onOpenGroup={() => {}}
		/>,
	);
	expect(noScale).toContain("No hay grupos para esta selección.");
	expect(noScale).toContain("No hay materias para esta selección.");
	expect(noScale).not.toContain('class="evaluation-column-bar"');
});
