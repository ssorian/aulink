// @ts-expect-error — Bun runs this test; the web app uses browser-only type declarations.
import { expect, test } from "bun:test";
import { Children, isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConductView } from "./conduct-view";
import { buildMockData } from "./mock-data";
import { StudentProfile } from "./student-profile";
import { options } from "./view-helpers";
import { activeGroup } from "./workflows";

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

test("attendance profile omits redundant controls and identity", () => {
	const { s, student } = setup();
	const html = render(s, student.id, "Asistencia");
	expect(html).toContain("<h2>Evidencia de asistencia</h2>");
	expect(html).not.toContain("<select");
	expect(html).not.toContain("Ver jornada de muestra");
	expect(html).not.toContain("expediente individual");
	expect(html).toContain("Sin registro no significa ausencia.");
	const headings = [...html.matchAll(/<h3>(.*?)<\/h3>/g)];
	expect(headings.length).toBeGreaterThan(0);
	for (const heading of headings)
		expect(heading[1]).not.toContain(student.name);
	expect(html).toContain("Ver evidencia original");
	expect(html).toContain("profile-badge");
});

test("conduct profile offers registration and omits repeated identity", () => {
	const { s, student } = setup();
	const html = render(s, student.id, "Conducta");
	expect(html).toMatch(/<h2[^>]*>Conducta<\/h2>/);
	expect(html).toContain(">Registrar reconocimiento o incidente</button>");
	expect(html).not.toContain(`<h2>Reconocimiento · ${student.name}</h2>`);
});

test("conduct profile empty state refers to its available action", () => {
	const { s, student } = setup();
	s.conduct = [];
	const html = render(s, student.id, "Conducta");
	expect(html).toContain(">Registrar reconocimiento o incidente</button>");
	expect(html).toContain(
		"Registra un reconocimiento o incidente con seguimiento concreto.",
	);
});

test("conduct registration fixes the student and current active group", () => {
	const { s, student } = setup();
	const group = s.groups.find(
		(g) =>
			g.name === "1° B" &&
			g.cycle ===
				student.enrollments.find(
					(e) => activeGroup(s, student.id, e.cycle) === g.id,
				)?.cycle,
	);
	if (!group) throw Error("active group missing");
	const calls: unknown[][] = [];
	const view = ConductView({
		s,
		studentId: student.id,
		groupId: group.id,
		open: (...args) => calls.push(args),
		students: options("student", "Alumno", [student]),
		studentName: () => student.name,
	});
	const button = Children.toArray(view.props.children).find(
		(child) => isValidElement(child) && child.type === "button",
	) as ReactElement<{ onClick: () => void }>;
	button.props.onClick();
	expect(calls[0][0]).toBe("conduct");
	expect(calls[0][3]).toEqual({ student: student.id, group: group.id });
	expect(
		(calls[0][2] as { key: string }[]).some((f) => f.key === "student"),
	).toBe(false);
});

test("group conduct keeps its original registration button", () => {
	const { s } = setup();
	const html = renderToStaticMarkup(
		<ConductView
			s={s}
			open={() => {}}
			students={options("student", "Alumno del grupo", s.students)}
			studentName={(id) => s.students.find((x) => x.id === id)?.name || id}
		/>,
	);
	expect(html).toContain(">Registrar reconocimiento / incidente</button>");
	const calls: unknown[][] = [];
	const view = ConductView({
		s,
		open: (...args) => calls.push(args),
		students: options("student", "Alumno del grupo", s.students),
		studentName: (id) => id,
	});
	const button = Children.toArray(view.props.children).find(
		(child) => isValidElement(child) && child.type === "button",
	) as ReactElement<{ onClick: () => void }>;
	button.props.onClick();
	expect(
		(calls[0][2] as { key: string }[]).some((f) => f.key === "student"),
	).toBe(true);
});

test("grade tables group cycles, sort rows and show statuses and actions", () => {
	const { s, student } = setup();
	const grades = s.grades.filter((g) => g.student === student.id);
	const original = grades[0];
	const assignment = s.assignments.find((a) => a.id === original.assignment);
	const previous = student.enrollments.find(
		(e) => e.cycle !== s.groups.find((g) => g.id === assignment?.group)?.cycle,
	);
	if (!assignment || !previous)
		throw Error("sample grades or earlier enrollment missing");
	s.assignments.push({
		...assignment,
		id: "previous-assignment",
		group: previous.group,
		subject: "Historia",
		period: "Periodo anterior",
	});
	s.grades.push({
		...original,
		id: "previous-grade",
		assignment: "previous-assignment",
		published: true,
		history: [],
	});
	const html = render(s, student.id, "Calificaciones");
	const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map(
		(m) => m[0],
	);
	expect(html).toContain("<h2>Calificaciones</h2>");
	expect(tables.length).toBe(2);
	expect(tables[0]).toContain(
		s.cycles.find(
			(c) => c.id === s.groups.find((g) => g.id === assignment.group)?.cycle,
		)?.name,
	);
	expect(tables[1]).toContain(
		s.cycles.find((c) => c.id === previous.cycle)?.name,
	);
	for (const table of tables) {
		for (const label of [
			"Materia",
			"Evaluación",
			"Calificación",
			"Estado",
			"Acciones",
		])
			expect(table).toContain(`<th scope="col">${label}</th>`);
		expect(table).not.toContain(student.name);
		expect(table).toContain('<th scope="row">');
	}
	const allGrades = s.grades.filter((g) => g.student === student.id);
	expect((html.match(/profile-badge--ok">Publicado/g) ?? []).length).toBe(
		allGrades.filter((g) => g.published).length,
	);
	expect((html.match(/profile-badge--warn">Borrador/g) ?? []).length).toBe(
		allGrades.filter((g) => !g.published).length,
	);
	for (const grade of allGrades) {
		const a = s.assignments.find((item) => item.id === grade.assignment);
		if (!a) throw Error("assignment missing");
		const group = s.groups.find((g) => g.id === a.group);
		const cycle = s.cycles.find((c) => c.id === group?.cycle);
		const table =
			tables.find((item) => item.includes(cycle?.name ?? "missing")) ?? "";
		const subject = a.subject.replace(/&/g, "&amp;");
		const period = a.period.replace(/&/g, "&amp;");
		const row =
			[...table.matchAll(/<tr>[\s\S]*?<\/tr>/g)]
				.map((m) => m[0])
				.find((item) =>
					item.includes(
						`aria-label="Corregir calificación de ${subject} · ${period}"`,
					),
				) ?? "";
		expect(row).toContain(
			`aria-label="Corregir calificación de ${subject} · ${period}"`,
		);
		expect(row).toContain(
			`aria-label="Revisar publicación de ${subject} · ${period}"`,
		);
		if (grade.published)
			expect(row).toMatch(/<button[^>]*disabled=""[^>]*>Revisar publicación/);
	}
	const ordered = [
		...tables[0].matchAll(/<th scope="row">([^<]*)<\/th><td>([^<]*)<\/td>/g),
	].map((m) => `${m[1]} · ${m[2]}`);
	expect(ordered).toEqual(
		[...ordered].sort((a, b) => a.localeCompare(b, "es")),
	);
});

test("grade history is disclosed and empty grades have a passive message", () => {
	const { s, student } = setup();
	const grade = s.grades.find((g) => g.student === student.id);
	if (!grade) throw Error("sample grade missing");
	grade.history = [
		{
			id: "history-test",
			value: "6 → 7",
			reason: "Corrección",
			author: "Docente",
		},
	];
	const html = render(s, student.id, "Calificaciones");
	expect(html).toContain("<summary>Historial (1)</summary>");
	expect(text(html)).toContain("6 → 7 · Corrección · Docente");
	s.grades = s.grades.filter((g) => g.student !== student.id);
	const empty = render(s, student.id, "Calificaciones");
	expect(empty).toContain("Sin calificaciones capturadas para este alumno.");
	expect(empty).not.toContain("<table");
});

test("profile buttons avoid slash labels", () => {
	for (const tab of [
		"Resumen",
		"Asistencia",
		"Calificaciones",
		"Conducta",
	] as const) {
		const labels = [
			...render(undefined, undefined, tab).matchAll(
				/<button[^>]*>([^<]*)<\/button>/g,
			),
		].map((m) => m[1]);
		expect(labels.filter((l) => l.includes(" / "))).toEqual([]);
	}
});
