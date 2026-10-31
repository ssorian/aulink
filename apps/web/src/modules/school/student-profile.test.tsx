// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { buildMockData } from "./mock-data";
import { StudentProfile } from "./student-profile";

function setup() {
	const s = buildMockData();
	const student = s.students.find((x) => x.matricula === "AUR-26101");
	if (!student) throw Error("sample student missing");
	return { s, student };
}

function render(
	s = setup().s,
	studentId = setup().student.id,
	initialTab?: "Resumen" | "Asistencia" | "Calificaciones" | "Conducta",
) {
	return renderToStaticMarkup(
		<StudentProfile
			s={s}
			open={() => {}}
			studentId={studentId}
			onGroup={() => {}}
			initialTab={initialTab}
		/>,
	);
}

const text = (html: string) =>
	html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

test("profile offers four tabs and opens on Resumen", () => {
	const html = render();
	const nav =
		html.match(/<nav class="workspace-tabs"[\s\S]*?<\/nav>/)?.[0] ?? "";
	const tabs = [...nav.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map(
		(m) => m[1],
	);
	expect(tabs).toEqual(["Resumen", "Asistencia", "Calificaciones", "Conducta"]);
	expect(nav).toContain('aria-current="page">Resumen</button>');
	for (const gone of ["Inscripciones", "Credenciales"])
		expect(nav).not.toContain(gone);
});

test("heading names the student with matrícula, active group, cycle and actions", () => {
	const html = render();
	const heading =
		html.match(/<section class="workspace-heading[\s\S]*?<\/section>/)?.[0] ??
		"";
	expect(heading).toContain("<h2>Alba Mendoza Ruiz</h2>");
	expect(text(heading)).toContain(
		"Matrícula AUR-26101 · 1° B · Agosto 2026 – Julio 2027",
	);
	expect(heading).toContain(">Reinscribir en otro ciclo</button>");
	expect(heading).toContain(">Cambiar de grupo</button>");
});

test("enrollment shows the current cycle first and folds earlier ones", () => {
	const html = render();
	const current = html.indexOf(
		"Agosto 2026 – Julio 2027",
		html.indexOf("Inscripción"),
	);
	const earlier = html.indexOf("Agosto 2025 – Julio 2026");
	expect(current).toBeGreaterThan(-1);
	expect(earlier).toBeGreaterThan(current);
	expect(html).toMatch(/<span class="profile-badge[^"]*">Actual<\/span>/);
	expect(html).toContain('aria-label="Abrir grupo 1° B"');
	expect(text(html)).toContain("Inscripción original 1° A");
	expect(text(html)).toContain("Motivo Cambio al turno vespertino");
	expect(text(html)).toContain("Registró Patricia Salgado Méndez");
	const details =
		html.match(
			/<details[^>]*>[\s\S]*?Ciclos anteriores[\s\S]*?<\/details>/,
		)?.[0] ?? "";
	expect(details).toContain("Agosto 2025 – Julio 2026");
	expect(details).toContain('aria-label="Abrir grupo 1° H"');
	// Same original and active group: the original line adds nothing.
	expect(details).not.toContain("Inscripción original");
});

test("parents or guardians list status, actions and folded history", () => {
	const html = render();
	expect(html).toContain("<h2");
	expect(text(html)).toContain("Padres o tutores");
	expect(html).toContain(">Vincular tutor</button>");
	expect(text(html)).toContain("Mariana Ruiz Salcedo");
	expect(text(html)).toContain("Javier Mendoza Esquivel");
	expect(html).toMatch(/profile-badge[^"]*">Verificado en el registro<\/span>/);
	expect(html).toMatch(/profile-badge[^"]*">Restringido<\/span>/);
	expect(html).toContain(
		'aria-label="Restringir o revocar a Mariana Ruiz Salcedo"',
	);
	expect(html).toMatch(
		/<details[^>]*><summary>Historial del vínculo<\/summary>/,
	);
});

test("credential shows the current revision and folds earlier ones without repeating identity", () => {
	const html = render();
	expect(text(html)).toContain("Revisión 2");
	expect(html).toMatch(/profile-badge[^"]*">Vigente<\/span>/);
	expect(text(html)).toContain("Credencial vigente para el ciclo escolar");
	expect(html).toContain(">Reemitir credencial</button>");
	const folded =
		html.match(
			/<details[^>]*><summary>Revisiones anteriores[\s\S]*?<\/details>/,
		)?.[0] ?? "";
	expect(text(folded)).toContain("Revisión 1");
	expect(html.match(/AUR-26101/g)?.length).toBe(1);
});

test("pending work counts drafts and links to their tabs", () => {
	const { s, student } = setup();
	const drafts = s.grades.filter(
		(g) => g.student === student.id && !g.published,
	).length;
	const reports = s.conduct.filter(
		(c) => c.student === student.id && !c.published,
	).length;
	const html = render(s, student.id);
	expect(drafts).toBeGreaterThan(0);
	expect(html).toContain(
		`>${drafts} ${drafts === 1 ? "calificación en borrador" : "calificaciones en borrador"}</button>`,
	);
	if (reports)
		expect(html).toContain(
			`>${reports} ${reports === 1 ? "reporte de conducta sin publicar" : "reportes de conducta sin publicar"}</button>`,
		);
});

test("pending work says so when everything is published", () => {
	const { s, student } = setup();
	for (const g of s.grades) g.published = true;
	for (const c of s.conduct) c.published = true;
	expect(text(render(s, student.id))).toContain(
		"Sin pendientes de publicación",
	);
});
