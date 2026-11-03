// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SidebarNav } from "./sidebar-nav";

const render = (page: Parameters<typeof SidebarNav>[0]["page"]) =>
	renderToStaticMarkup(<SidebarNav page={page} onNavigate={() => {}} />);

test("multi-page sections collapse and only the current one starts expanded", () => {
	const html = render("Grupos");
	expect(html).toContain('data-slot="sidebar-nav"');
	expect(html).toContain(
		'aria-expanded="true" aria-controls="nav-gestión-académica"',
	);
	expect(html).toContain(
		'aria-expanded="false" aria-controls="nav-comunidad-escolar"',
	);
	expect(html).toMatch(
		/<ul[^>]*data-slot="nav-pages"[^>]*id="nav-comunidad-escolar"[^>]*hidden/,
	);
	expect(html).not.toMatch(/<ul[^>]*id="nav-gestión-académica"[^>]*hidden/);
	expect(html).toMatch(/<button[^>]*aria-current="page"[^>]*>Grupos<\/button>/);
	expect(html).toContain(">Ciclos y calendario</button>");
	expect(html.match(/aria-current="page"/g)).toHaveLength(1);
	expect(html.match(/data-slot="nav-section"/g)).toHaveLength(6);
	expect(html.match(/data-active/g)).toHaveLength(1);
});

test("single-page sections stay direct links without a toggle", () => {
	const html = render("Inicio");
	expect(html).toMatch(
		/<button[^>]*aria-current="page"[^>]*><span[^>]*><svg[\s\S]*?<\/svg><\/span>Inicio<\/button>/,
	);
	expect(html).not.toContain('aria-controls="nav-inicio"');
	expect(html.match(/aria-expanded="/g)).toHaveLength(5);
});

test("evaluation sections live in the sidebar instead of in-page tabs", () => {
	const html = render("Alumnos en riesgo");
	expect(html).toContain('aria-expanded="true" aria-controls="nav-evaluación"');
	expect(html).toContain(">Avance del periodo</button>");
	expect(html).toMatch(
		/<button[^>]*aria-current="page"[^>]*>Alumnos en riesgo<\/button>/,
	);
	expect(html).toContain(">Resultados</button>");
});

test("the shell ships no legacy class hooks", () => {
	const html = render("Grupos");
	for (const legacy of ['nav-section"', "nav-toggle", 'nav-pages"', "sidebar"])
		expect(html).not.toContain(`class="${legacy}`);
	expect(html).not.toMatch(
		/class="[^"]*\b(nav-section|nav-toggle|nav-pages)\b/,
	);
});
