// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SidebarNav } from "./sidebar-nav";

const render = (page: Parameters<typeof SidebarNav>[0]["page"]) =>
	renderToStaticMarkup(<SidebarNav page={page} onNavigate={() => {}} />);

test("multi-page sections collapse and only the current one starts expanded", () => {
	const html = render("Grupos");
	expect(html).toContain(
		'aria-expanded="true" aria-controls="nav-gestión-académica"',
	);
	expect(html).toContain(
		'aria-expanded="false" aria-controls="nav-comunidad-escolar"',
	);
	expect(html).toMatch(/id="nav-comunidad-escolar" class="nav-pages" hidden/);
	expect(html).toContain('aria-current="page">Grupos</button>');
	expect(html).toContain(">Ciclos y calendario</button>");
	expect(html.match(/aria-current="page"/g)).toHaveLength(1);
});

test("single-page sections stay direct links without a toggle", () => {
	const html = render("Inicio");
	expect(html).toMatch(
		/<button type="button" aria-current="page"><svg[^]*?<\/svg>Inicio<\/button>/,
	);
	expect(html).not.toContain('aria-controls="nav-inicio"');
	expect(html.match(/aria-expanded/g)).toHaveLength(5);
});

test("evaluation sections live in the sidebar instead of in-page tabs", () => {
	const html = render("Alumnos en riesgo");
	expect(html).toContain('aria-expanded="true" aria-controls="nav-evaluación"');
	expect(html).toContain(">Avance del periodo</button>");
	expect(html).toContain('aria-current="page">Alumnos en riesgo</button>');
	expect(html).toContain(">Resultados</button>");
});
