// @ts-expect-error — Bun test types are not part of the browser app.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { initialState } from "../shared/workflows";
import { type Flow, FlowDialog, flowDraftKey } from "./flow-dialog";
import { SetupView } from "./setup-view";

test("draft identity separates dates and preserves other flow identities", () => {
	const flow: Flow = {
		kind: "exception",
		title: "Sin clases",
		description: "",
		fields: [],
		values: { date: "2026-04-01" },
	};
	expect(flowDraftKey(flow)).not.toBe(
		flowDraftKey({ ...flow, values: { date: "2026-04-02" } }),
	);
	expect(flowDraftKey(flow)).toBe(flowDraftKey({ ...flow }));
	expect(flowDraftKey({ ...flow, values: { id: "a" } })).not.toBe(
		flowDraftKey({ ...flow, values: { id: "b" } }),
	);
});

test("dialog exposes landmarks, step state and a labelled close control", () => {
	const html = renderToStaticMarkup(
		<FlowDialog
			flow={{
				kind: "x",
				title: "Crear",
				description: "Descripción",
				fields: [{ key: "name", label: "Nombre" }],
				values: {},
			}}
			onClose={() => {}}
			onConfirm={() => {}}
		/>,
	);
	expect(html).toContain('data-slot="flow-dialog"');
	expect(html).toContain('aria-labelledby="flow-dialog-heading"');
	expect(html).toContain('aria-label="Cerrar y conservar captura"');
	expect(html).toMatch(/data-slot="flow-steps"/);
	expect(html).toMatch(/aria-current="step"[^>]*>1\. Completar/);
	expect(html).not.toContain('data-slot="flow-review"');
	expect(html).toContain("Revisar cambios");
});

test("school tab keeps edit action and storage tools disclosure", () => {
	const html = renderToStaticMarkup(
		<SetupView
			s={initialState()}
			open={() => {}}
			storageStatus="Guardado"
			onLoadExamples={() => {}}
		/>,
	);
	expect(html).toContain("Editar institución");
	expect(html).toMatch(/<details data-slot="storage-tools"/);
	expect(html).toContain("Añadir registros de ejemplo");
	expect(html).toContain("Guardado");
});
