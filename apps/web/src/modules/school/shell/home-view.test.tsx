// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { buildMockData } from "../shared/mock-data";
import { HomeView } from "./home-view";

const render = (mutate?: (s: ReturnType<typeof buildMockData>) => void) => {
	const s = buildMockData();
	mutate?.(s);
	return renderToStaticMarkup(<HomeView s={s} onNavigate={() => {}} />);
};

test("Inicio shows one stat card per count, each with its action", () => {
	const html = render();
	expect(html).toContain('aria-label="Resumen escolar"');
	expect((html.match(/data-slot="card"/g) ?? []).length).toBeGreaterThanOrEqual(
		5,
	);
	for (const action of [
		"Ver alumnos",
		"Ver grupos",
		"Ver comunicados",
		"Ver terminales",
	])
		expect(html).toContain(`>${action}</button>`);
	for (const label of [
		"Alumnos registrados",
		"Grupos",
		"Borradores de comunicados",
		"Terminales configuradas",
	])
		expect(html).toContain(label);
	expect(html).toMatch(/activas · \d+ inactivas en configuración\./);
	expect(html).not.toMatch(/class="[^"]*\bhome-/);
});

test("pending tasks keep their counts and navigation actions as a list", () => {
	const html = render((s) => {
		s.notices = [
			{
				id: "n1",
				title: "d",
				text: "t",
				audience: "school",
				target: "",
				recipients: [],
				published: false,
			},
		] as typeof s.notices;
	});
	expect(html).toContain('aria-labelledby="home-tasks-title"');
	expect(html).toContain("Comunicados en borrador");
	expect(html).toContain(">Revisar comunicados");
});

test("an empty school offers the first-group action and no pending list", () => {
	const html = render((s) => {
		s.students = [];
		s.groups = [];
		s.assignments = [];
		s.schedules = [];
		s.notices = [];
	});
	expect(html).toContain("Sin pendientes por revisar.");
	expect(html).toContain('data-slot="empty-state"');
	expect(html).toContain("Crear primer grupo");
});
