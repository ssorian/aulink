import { expect, test } from "bun:test";
import { createRequire } from "node:module";
import { GroupFollowupView } from "../apps/web/src/modules/school/group-followup-view";
import { SetupView } from "../apps/web/src/modules/school/setup-view";
import { StaffView } from "../apps/web/src/modules/school/staff-view";
import { initialState } from "../apps/web/src/modules/school/workflows";
const requireWeb = createRequire(new URL("../apps/web/package.json", import.meta.url));
const { createElement } = requireWeb("react");
const { renderToStaticMarkup } = requireWeb("react-dom/server");
import { schoolNavigation, sectionFor } from "../apps/web/src/modules/school/navigation";

test("six administrator sections own unique existing destinations", () => {
	expect(schoolNavigation.map((section) => section.label)).toEqual([
		"Inicio", "Comunidad escolar", "Gestión académica", "Evaluación", "Vida escolar", "Administración",
	]);
	const pages = schoolNavigation.flatMap((section) => section.pages);
	expect(new Set(pages).size).toBe(pages.length);
	for (const page of pages) expect(sectionFor(page).pages).toContain(page);
});

test("contextual destinations highlight their owning section", () => {
	expect(sectionFor("Alumnos").label).toBe("Comunidad escolar");
	expect(sectionFor("Personal").label).toBe("Comunidad escolar");
	expect(sectionFor("Grupos").label).toBe("Gestión académica");
	expect(sectionFor("Ciclos y calendario").label).toBe("Gestión académica");
	expect(sectionFor("Calificaciones").label).toBe("Evaluación");
	for (const page of ["Comunicados", "Asistencia", "Conducta"] as const) {
		expect(sectionFor(page).label).toBe("Vida escolar");
	}
	expect(sectionFor("Terminales").label).toBe("Administración");
});

test("follow-up views require explicit group context and isolate student records", () => {
	const s = initialState();
	const render = (mode: string, groupId: string) => renderToStaticMarkup(createElement(GroupFollowupView, { s, mode, groupId, onGroup: () => {}, open: () => {} }));
	for (const mode of ["Calificaciones", "Conducta"]) {
		expect(render(mode, "")).toContain("Selecciona un grupo para consultar sus registros.");
		expect(render(mode, "")).not.toContain("<table");
	}
	expect(render("Asistencia", "")).toContain("Panorama escolar");
	expect(render("Asistencia", "")).not.toContain("Ana Sofía Mendoza Ruiz");
	const attendance = render("Asistencia", "g1");
	expect(attendance).toContain("Ana Sofía Mendoza Ruiz");
	expect(attendance).not.toContain("Leonardo Castillo Vega");
	s.groups = [];
	expect(render("Conducta", "")).toContain("Crea un grupo en Gestión académica");
});

test("administration and academic calendar no longer duplicate staff or nested navigation", () => {
	const s = initialState();
	for (const tab of ["Escuela", "Ciclos y calendario", "Terminales"]) {
		const markup = renderToStaticMarkup(createElement(SetupView, { s, tab, open: () => {} }));
		expect(markup).not.toContain("Agregar personal");
		expect(markup).not.toContain("workspace-tabs");
		expect(markup.includes("Almacenamiento y herramientas")).toBe(tab === "Escuela");
	}
	const staff = renderToStaticMarkup(createElement(StaffView, { s, open: () => {} }));
	expect(staff).toContain("Directorio del personal");
	expect(staff).toContain("Personal de la escuela");
});
